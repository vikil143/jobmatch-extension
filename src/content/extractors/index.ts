import type { JobPosting } from '../../types/jobs'
import { extractLinkedInJD } from './linkedin'
import { extractNaukriJD } from './naukri'

export type Extractor = () => JobPosting | null

export function getExtractor(hostname: string): Extractor | null {
  if (hostname.includes('linkedin.com')) return extractLinkedInJD
  if (hostname.includes('naukri.com')) return extractNaukriJD
  return null
}
