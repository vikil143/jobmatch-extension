import type { JobPosting } from '../../types/jobs'

export function extractIndeedJD(): JobPosting | null {
  // On /jobs?q=... search results the JD renders in a right-side preview pane;
  // on direct /viewjob pages the same elements sit at the document root.
  // Try the scoped pane first so search-result clicks are handled correctly.
  const scope: ParentNode =
    document.querySelector('[data-testid="job-detail-pane"]') ??
    document.querySelector('div.jobsearch-RightPane') ??
    document

  const titleEl =
    scope.querySelector<HTMLElement>('[data-testid="jobsearch-JobInfoHeader-title"]') ??
    scope.querySelector<HTMLElement>('h1.jobsearch-JobInfoHeader-title') ??
    scope.querySelector<HTMLElement>('h1')

  const companyEl =
    scope.querySelector<HTMLElement>('[data-testid="inlineHeader-companyName"] a') ??
    scope.querySelector<HTMLElement>('[data-testid="inlineHeader-companyName"]') ??
    scope.querySelector<HTMLElement>('[data-company-name="true"]')

  const descEl =
    scope.querySelector<HTMLElement>('#jobDescriptionText') ??
    scope.querySelector<HTMLElement>('div.jobsearch-jobDescriptionText')

  const title = titleEl?.innerText?.trim()
  const company = companyEl?.innerText?.trim()
  const description = descEl?.innerText?.trim()

  if (!title || !company || !description) return null

  return {
    site: 'indeed',
    title,
    company,
    description,
    url: window.location.href,
    extractedAt: Date.now(),
  }
}
