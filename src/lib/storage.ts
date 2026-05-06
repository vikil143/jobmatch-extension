import type { ApplicationRecord, ApplicationStatus, HistoryRecord } from '../types/jobs'

export interface CvRecord {
  filename: string
  text: string
  parsedAt: number
}

const CV_KEY = 'cv:default'
const HISTORY_KEY = 'history:v1'
const HISTORY_MAX = 20

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

const APP_KEY = 'applications:v1'

export const applicationStorage = {
  async get(): Promise<ApplicationRecord[]> {
    const result = await chrome.storage.local.get(APP_KEY)
    return (result[APP_KEY] as ApplicationRecord[]) ?? []
  },

  async upsert(record: ApplicationRecord): Promise<void> {
    const existing = await applicationStorage.get()
    const idx = existing.findIndex((r) => r.id === record.id)
    const updated =
      idx >= 0 ? existing.map((r, i) => (i === idx ? record : r)) : [record, ...existing]
    await chrome.storage.local.set({ [APP_KEY]: updated })
  },

  async move(id: string, status: ApplicationStatus): Promise<void> {
    const existing = await applicationStorage.get()
    const updated = existing.map((r) =>
      r.id === id ? { ...r, status, movedAt: Date.now() } : r,
    )
    await chrome.storage.local.set({ [APP_KEY]: updated })
  },

  async remove(id: string): Promise<void> {
    const existing = await applicationStorage.get()
    await chrome.storage.local.set({ [APP_KEY]: existing.filter((r) => r.id !== id) })
  },

  async clear(): Promise<void> {
    await chrome.storage.local.remove(APP_KEY)
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
