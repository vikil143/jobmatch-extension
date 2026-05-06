export interface JobPosting {
  site: 'linkedin' | 'naukri'
  title: string
  company: string
  description: string
  url: string
  extractedAt: number
}

export interface MatchResult {
  score: number
  skillCoverage: number
  keywordOverlap: number   // TF-cosine similarity
  semanticScore?: number   // embedding cosine; absent until the model resolves
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
