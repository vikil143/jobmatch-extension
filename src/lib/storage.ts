import type { HistoryRecord, Profile } from '../types/jobs'

export interface CvRecord {
  filename: string
  text: string
  parsedAt: number
}

const CV_KEY = 'cv:default'
const HISTORY_KEY = 'history:v1'
const HISTORY_MAX = 20
export const PROFILE_KEY = 'profile:v1'

export const cvStorage = {
  async get(): Promise<CvRecord | null> {
    const result = await chrome.storage.local.get(CV_KEY)
    return (result[CV_KEY] as CvRecord) ?? null
  },

  async set(record: CvRecord): Promise<void> {
    await chrome.storage.local.set({ [CV_KEY]: record })
  },

  async clear(): Promise<void> {
    await chrome.storage.local.remove(CV_KEY)
  },
}

export const profileStorage = {
  async get(): Promise<Profile | null> {
    const result = await chrome.storage.local.get(PROFILE_KEY)
    return (result[PROFILE_KEY] as Profile) ?? null
  },

  async set(profile: Profile): Promise<void> {
    await chrome.storage.local.set({ [PROFILE_KEY]: profile })
  },

  async clear(): Promise<void> {
    await chrome.storage.local.remove(PROFILE_KEY)
  },
}

export const historyStorage = {
  async get(): Promise<HistoryRecord[]> {
    const result = await chrome.storage.local.get(HISTORY_KEY)
    return (result[HISTORY_KEY] as HistoryRecord[]) ?? []
  },

  async push(record: HistoryRecord): Promise<void> {
    const existing = await historyStorage.get()
    // Deduplicate by job URL — keep most recent
    const deduped = existing.filter((r) => r.job.url !== record.job.url)
    const updated = [record, ...deduped].slice(0, HISTORY_MAX)
    await chrome.storage.local.set({ [HISTORY_KEY]: updated })
  },

  async clear(): Promise<void> {
    await chrome.storage.local.remove(HISTORY_KEY)
  },
}

export async function exportAllData(): Promise<Record<string, unknown>> {
  const result = await chrome.storage.local.get(null)
  return result
}

export async function importAllData(data: Record<string, unknown>): Promise<void> {
  await chrome.storage.local.clear()
  await chrome.storage.local.set(data)
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear()
}
