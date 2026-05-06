import { useState, useEffect } from 'react'
import type { JobPosting } from '../../types/jobs'

interface Props {
  jd: JobPosting | null
  isLoading: boolean
  onManualJd?: (text: string) => void
}

const TRUNCATE_AT = 300
const FALLBACK_DELAY_MS = 4000

export default function JDPreview({ jd, isLoading, onManualJd }: Props) {
  const [showMore, setShowMore] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [manualText, setManualText] = useState('')

  useEffect(() => { setShowMore(false) }, [jd])

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
        <div className="animate-pulse space-y-2.5">
          <div className="h-2.5 w-16 rounded bg-gray-800" />
          <div className="h-4 w-4/5 rounded bg-gray-800" />
          <div className="h-3 w-2/5 rounded bg-gray-800" />
          <div className="space-y-1.5 pt-1">
            <div className="h-2.5 w-full rounded bg-gray-800" />
            <div className="h-2.5 w-full rounded bg-gray-800" />
            <div className="h-2.5 w-3/4 rounded bg-gray-800" />
          </div>
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
        <p className="text-xs text-gray-500">{jd.company}</p>

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

  return (
    <section className="p-4 border-b border-gray-800 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-400">No job detected</p>
        <p className="text-xs leading-relaxed text-gray-600">
          Open a job on LinkedIn or Naukri and it will appear here automatically.
        </p>
      </div>
      <div className="rounded-lg border border-gray-800/60 bg-gray-900/30 px-3 py-2.5 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-700">Supported URLs</p>
        <p className="font-mono text-[11px] text-gray-700">linkedin.com/jobs/view/…</p>
        <p className="font-mono text-[11px] text-gray-700">naukri.com/job-listings-…</p>
      </div>

      {showFallback && (
        <div className="space-y-2">
          <p className="text-xs text-amber-600/80">
            Auto-extraction didn't work — paste the job description below:
          </p>
          <textarea
            value={manualText}
            onChange={(e) => {
              setManualText(e.target.value)
              onManualJd?.(e.target.value)
            }}
            rows={6}
            placeholder="Paste job description here…"
            className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-xs text-gray-300 placeholder-gray-700 focus:border-gray-600 focus:outline-none"
          />
        </div>
      )}
    </section>
  )
}
