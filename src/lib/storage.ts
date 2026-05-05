export interface CvRecord {
  filename: string
  text: string
  parsedAt: number
}

const CV_KEY = 'cv:default'

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
