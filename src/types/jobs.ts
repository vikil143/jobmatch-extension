export interface JobPosting {
  site: 'indeed' | 'linkedin' | 'naukri'
  title: string
  company: string
  description: string
  url: string
  extractedAt: number
}

export interface MatchResult {
  score: number
  skillCoverage: number
  keywordOverlap: number
  matchedSkills: string[]
  missingSkills: string[]
  extraSkills: string[]
}

export interface HistoryRecord {
  id: string
  job: JobPosting
  match: MatchResult
  savedAt: number
}

export type ApplicationStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected'

export interface ApplicationRecord {
  id: string
  title: string
  company: string
  matchScore?: number
  url?: string
  status: ApplicationStatus
  movedAt: number
  createdAt: number
}
