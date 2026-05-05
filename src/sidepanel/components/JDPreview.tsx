import { useState, useEffect } from 'react'
import type { JobPosting } from '../../types/jobs'

interface Props {
  jd: JobPosting | null
  isLoading: boolean
}

const TRUNCATE_AT = 300
// Seconds before the manual-paste fallback appears when extraction returns null.
const FALLBACK_DELAY_MS = 3000

export default function JDPreview({ jd, isLoading }: Props) {
  const [showMore, setShowMore] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [manualText, setManualText] = useState('')

  // Reset expand state when a new JD arrives.
  useEffect(() => { setShowMore(false) }, [jd])

  // Show manual-paste textarea 3 s after component mounts with no JD.
  useEffect(() => {
    if (isLoading || jd !== null) {
      setShowFallback(false)
      return
    }
    const t = setTimeout(() => setShowFallback(true), FALLBACK_DELAY_MS)
    return () => clearTimeout(t)
  }, [jd, isLoading])

  if (isLoading) {
    return (
      <section className="p-4 border-b border-gray-800 space-y-3" aria-label="Loading job posting">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-24 rounded bg-gray-800" />
          <div className="h-4 w-3/4 rounded bg-gray-800" />
          <div className="h-3 w-1/2 rounded bg-gray-800" />
          <div className="h-20 w-full rounded bg-gray-800" />
        </div>
      </section>
    )
  }

  if (jd) {
    const preview = jd.description.slice(0, TRUNCATE_AT)
    const isTruncated = jd.description.length > TRUNCATE_AT

    return (
      <section className="p-4 border-b border-gray-800 space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              jd.site === 'linkedin'
                ? 'bg-blue-900/40 text-blue-400'
                : 'bg-orange-900/40 text-orange-400'
            }`}
          >
            {jd.site === 'linkedin' ? 'LinkedIn' : 'Naukri'}
          </span>
        </div>

        <h2 className="text-sm font-semibold leading-snug text-gray-100">{jd.title}</h2>
        <p className="text-xs text-gray-400">{jd.company}</p>

        <p className="text-xs leading-relaxed text-gray-500">
          {showMore ? jd.description : preview}
          {!showMore && isTruncated && '…'}
        </p>

        {isTruncated && (
          <button
            onClick={() => setShowMore((v) => !v)}
            className="text-xs text-sky-400 transition-colors hover:text-sky-300"
          >
            {showMore ? 'Show less' : 'Show more'}
          </button>
        )}
      </section>
    )
  }

  // Empty / fallback state
  return (
    <section className="p-4 border-b border-gray-800 space-y-3">
      <p className="text-sm text-gray-500">
        Open a job posting on LinkedIn or Naukri to begin.
      </p>
      <ul className="space-y-0.5 text-[11px] text-gray-700">
        <li>linkedin.com/jobs/view/…</li>
        <li>naukri.com/job-listings-…</li>
      </ul>

      {showFallback && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-yellow-600">
            Couldn't extract JD automatically — paste it below:
          </p>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={6}
            placeholder="Paste job description here…"
            className="w-full resize-none rounded border border-gray-700 bg-gray-900 p-2 text-xs text-gray-300 placeholder-gray-600 focus:border-gray-600 focus:outline-none"
          />
        </div>
      )}
    </section>
  )
}
