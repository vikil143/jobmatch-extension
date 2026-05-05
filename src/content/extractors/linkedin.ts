import type { JobPosting } from '../../types/jobs'

export function extractLinkedInJD(): JobPosting | null {
  // Title — LinkedIn has changed this selector several times; try in order of
  // likelihood so whichever generation of the DOM is active gets matched.
  const titleEl =
    document.querySelector<HTMLElement>('.job-details-jobs-unified-top-card__job-title h1') ??
    document.querySelector<HTMLElement>('.job-details-jobs-unified-top-card__job-title') ??
    document.querySelector<HTMLElement>('h1.t-24.t-bold.inline') ??
    document.querySelector<HTMLElement>('h1.jobs-unified-top-card__job-title')

  const companyEl =
    document.querySelector<HTMLElement>('.job-details-jobs-unified-top-card__company-name a') ??
    document.querySelector<HTMLElement>('.job-details-jobs-unified-top-card__company-name') ??
    document.querySelector<HTMLElement>('.jobs-unified-top-card__company-name a') ??
    document.querySelector<HTMLElement>('.jobs-unified-top-card__company-name')

  // Description container — innerText is preferred over textContent to respect
  // <br> line breaks and hidden elements.
  const descEl =
    document.querySelector<HTMLElement>('.jobs-description__content') ??
    document.querySelector<HTMLElement>('.jobs-description-content__text') ??
    document.querySelector<HTMLElement>('#job-details') ??
    document.querySelector<HTMLElement>('.jobs-box__html-content')

  const title = titleEl?.innerText?.trim()
  const company = companyEl?.innerText?.trim()
  const description = descEl?.innerText?.trim()

  if (!title || !company || !description) return null

  return {
    site: 'linkedin',
    title,
    company,
    description,
    url: window.location.href,
    extractedAt: Date.now(),
  }
}
