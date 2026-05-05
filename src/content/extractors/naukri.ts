import type { JobPosting } from '../../types/jobs'

export function extractNaukriJD(): JobPosting | null {
  // Naukri uses CSS-module-style class names (e.g. styles_jd-header-title__rZwM1).
  // We match on the stable BEM-like prefix using [class*=] attribute selectors so
  // minor hash suffix changes don't break us.
  const titleEl =
    document.querySelector<HTMLElement>('[class*="jd-header-title"]') ??
    document.querySelector<HTMLElement>('h1.jd-header-title') ??
    document.querySelector<HTMLElement>('h1')

  const companyEl =
    document.querySelector<HTMLElement>('[class*="jd-header-comp-name"] a') ??
    document.querySelector<HTMLElement>('[class*="jd-header-comp-name"]') ??
    document.querySelector<HTMLElement>('a.comp-name')

  const descEl =
    document.querySelector<HTMLElement>('[class*="JDC__dang-inner-html"]') ??
    document.querySelector<HTMLElement>('[class*="job-desc"]') ??
    document.querySelector<HTMLElement>('.dang-inner-html')

  const title = titleEl?.innerText?.trim()
  const company = companyEl?.innerText?.trim()
  // Naukri renders description as raw HTML; textContent captures all visible text.
  const description = descEl?.innerText?.trim() ?? descEl?.textContent?.trim()

  if (!title || !company || !description) return null

  return {
    site: 'naukri',
    title,
    company,
    description,
    url: window.location.href,
    extractedAt: Date.now(),
  }
}
