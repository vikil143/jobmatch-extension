import type { JobPosting } from './jobs'

export type ExtensionMessage =
  | { type: 'JD_EXTRACTED'; payload: JobPosting }
  | { type: 'GET_CURRENT_JD' }
  | { type: 'CURRENT_JD'; payload: JobPosting | null }
