import { useState, useEffect } from 'react'
import { historyStorage } from '../../lib/storage'
import type { HistoryRecord } from '../../types/jobs'

function scoreColor(score: number) {
  if (score >= 76) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    historyStorage.get().then((r) => {
      setRecords(r)
      setLoaded(true)
    }).catch(() => setLoaded(true))

    function onStorageChange(changes: Record<string, chrome.storage.StorageChange>) {
      if ('history:v1' in changes) {
        const next = changes['history:v1']?.newValue as HistoryRecord[] | undefined
        setRecords(next ?? [])
      }
    }
    chrome.storage.local.onChanged.addListener(onStorageChange)
    return () => chrome.storage.local.onChanged.removeListener(onStorageChange)
  }, [])

  if (!loaded) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full rounded-lg bg-gray-900 animate-pulse" />
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-gray-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">No history yet</p>
          <p className="text-xs text-gray-600">Jobs you match against will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-800/60">
      {records.map((record) => (
        <button
          key={record.id}
          onClick={() => chrome.tabs.create({ url: record.job.url })}
          className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-900/60 focus:outline-none focus-visible:bg-gray-900/60"
        >
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 font-mono text-xl font-bold tabular-nums leading-none ${scoreColor(record.match.score)}`}>
              {record.match.score}
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-sm font-medium text-gray-100 leading-snug">
                {record.job.title}
              </p>
              <p className="truncate text-xs text-gray-500">{record.job.company}</p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className={`rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider ${
                    record.job.site === 'linkedin'
                      ? 'bg-blue-900/40 text-blue-400'
                      : 'bg-orange-900/40 text-orange-400'
                  }`}
                >
                  {record.job.site === 'linkedin' ? 'LinkedIn' : 'Naukri'}
                </span>
                <span className="text-[10px] text-gray-700">{timeAgo(record.savedAt)}</span>
              </div>
            </div>
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  )
}
