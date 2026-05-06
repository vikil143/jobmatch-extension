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

export interface BulletRewrite {
  id: string
  original: string
  suggested: string
  rationale: string
}

export interface TailoredResume {
  generatedAt: number
  provider: 'prompt-api' | 'gemini-api'
  summary: string
  bulletRewrites: BulletRewrite[]
  emphasis: string[]
  deemphasis: string[]
  keywordsToWeaveIn: string[]
  genuineGaps: string[]
  userEdits: Record<string, string>
}

export interface ApplicationRecord {
  id: string
  title: string
  company: string
  matchScore?: number
  url?: string
  status: ApplicationStatus
  movedAt: number
  createdAt: number
  jobDescription?: string
  tailoredResume?: TailoredResume
}
