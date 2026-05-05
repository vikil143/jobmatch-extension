export interface JobPosting {
  site: 'linkedin' | 'naukri'
  title: string
  company: string
  description: string
  url: string
  extractedAt: number
}
