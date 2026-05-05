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
  keywordOverlap: number
  matchedSkills: string[]
  missingSkills: string[]
  extraSkills: string[]
}
