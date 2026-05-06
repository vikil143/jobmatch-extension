import { useState, useEffect, useRef } from 'react'
import { applicationStorage } from '../../lib/storage'
import type { ApplicationRecord, ApplicationStatus } from '../../types/jobs'
import TailoredResumePanel from './TailoredResumePanel'

const COLUMNS: {
  key: ApplicationStatus
  label: string
  textClass: string
  borderClass: string
  bgClass: string
}[] = [
  {
    key: 'saved',
    label: 'Saved',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-700/50',
    bgClass: 'bg-sky-950/20',
  },
  {
    key: 'applied',
    label: 'Applied',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-700/50',
    bgClass: 'bg-violet-950/20',
  },
  {
    key: 'interviewing',
    label: 'Interviewing',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-700/50',
    bgClass: 'bg-amber-950/20',
  },
  {
    key: 'offer',
    label: 'Offer',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-700/50',
    bgClass: 'bg-emerald-950/20',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-700/50',
    bgClass: 'bg-rose-950/20',
  },
]

function scoreColor(score: number) {
  if (score >= 76) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

function formatDate(ts: number): string {
  const diff = Date.now() - ts
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Card detail view
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: 'border-sky-700/50 text-sky-400 bg-sky-950/20',
  applied: 'border-violet-700/50 text-violet-400 bg-violet-950/20',
  interviewing: 'border-amber-700/50 text-amber-400 bg-amber-950/20',
  offer: 'border-emerald-700/50 text-emerald-400 bg-emerald-950/20',
  rejected: 'border-rose-700/50 text-rose-400 bg-rose-950/20',
}

interface CardDetailProps {
  record: ApplicationRecord
  onBack: () => void
}

function CardDetail({ record, onBack }: CardDetailProps) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded p-1 text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-300"
          aria-label="Back to tracker"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[10px] font-medium">Back</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[11px] font-semibold text-gray-100">{record.title}</p>
          <p className="truncate text-[10px] text-gray-600">{record.company}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {record.matchScore != null && (
            <span className={`font-mono text-[11px] font-bold ${scoreColor(record.matchScore)}`}>
              {record.matchScore}
            </span>
          )}
          <span
            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[record.status]}`}
          >
            {record.status}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 border-b border-gray-800/60 px-3 py-1.5">
        {record.url && (
          <a
            href={record.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-gray-600 transition-colors hover:text-sky-400"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open job
          </a>
        )}
        <span className="text-[10px] text-gray-700">Added {formatDate(record.createdAt)}</span>
        {!record.jobDescription && (
          <span className="text-[10px] text-amber-700">No JD stored — re-save from Match tab</span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <TailoredResumePanel record={record} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kanban card
// ---------------------------------------------------------------------------

interface CardProps {
  record: ApplicationRecord
  onDragStart: () => void
  onDragEnd: () => void
  onDelete: () => void
  onOpen: () => void
}

function AppCard({ record, onDragStart, onDragEnd, onDelete, onOpen }: CardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className="group relative cursor-pointer select-none rounded-lg border border-gray-800/60 bg-gray-900 p-3 active:cursor-grabbing active:opacity-50 hover:border-gray-700/60"
    >
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute right-1.5 top-1.5 hidden h-4 w-4 items-center justify-center rounded text-gray-700 transition-colors hover:text-rose-400 group-hover:flex"
        aria-label="Remove"
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M1 1l10 10M11 1L1 11" />
        </svg>
      </button>
      <div className="space-y-1 pr-3">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-gray-100">
          {record.title}
        </p>
        <p className="truncate text-[10px] text-gray-500">{record.company}</p>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] text-gray-700">{formatDate(record.movedAt)}</span>
          <div className="flex items-center gap-1.5">
            {record.tailoredResume && (
              <span className="text-[9px] text-violet-600" title="Has tailored resume">✦</span>
            )}
            {record.matchScore != null && (
              <span className={`font-mono text-[11px] font-bold ${scoreColor(record.matchScore)}`}>
                {record.matchScore}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

export default function Tracker() {
  const [records, setRecords] = useState<ApplicationRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  useEffect(() => {
    applicationStorage
      .get()
      .then((r) => {
        setRecords(r)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))

    function onStorageChange(changes: Record<string, chrome.storage.StorageChange>) {
      if ('applications:v1' in changes) {
        const next = changes['applications:v1']?.newValue as ApplicationRecord[] | undefined
        setRecords(next ?? [])
      }
    }
    chrome.storage.local.onChanged.addListener(onStorageChange)
    return () => chrome.storage.local.onChanged.removeListener(onStorageChange)
  }, [])

  async function handleDrop(targetStatus: ApplicationStatus) {
    const id = dragId.current
    dragId.current = null
    setDragOver(null)
    if (id) await applicationStorage.move(id, targetStatus)
  }

  // Detail view
  if (selectedId) {
    const record = records.find((r) => r.id === selectedId)
    if (record) {
      return (
        <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 88px)' }}>
          <CardDetail record={record} onBack={() => setSelectedId(null)} />
        </div>
      )
    }
    // Record was deleted while detail was open
    setSelectedId(null)
  }

  if (!loaded) {
    return (
      <div className="flex gap-3 overflow-x-auto p-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="w-40 flex-none space-y-2">
            <div className="h-7 w-full animate-pulse rounded-md bg-gray-800" />
            <div className="h-20 w-full animate-pulse rounded-lg bg-gray-900" />
          </div>
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-gray-700">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">No applications tracked</p>
          <p className="text-xs text-gray-600">
            Use "Track this job" in the Match tab to add jobs here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto p-4">
      <div className="flex gap-3" style={{ minWidth: `${COLUMNS.length * 172}px` }}>
        {COLUMNS.map((col) => {
          const cards = records.filter((r) => r.status === col.key)
          const isTarget = dragOver === col.key

          return (
            <div
              key={col.key}
              className="flex w-40 flex-none flex-col gap-2"
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(col.key)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver(null)
                }
              }}
              onDrop={() => void handleDrop(col.key)}
            >
              {/* Column header */}
              <div
                className={`flex items-center justify-between rounded-md border px-2 py-1.5 ${col.borderClass} ${col.bgClass}`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.12em] ${col.textClass}`}
                >
                  {col.label}
                </span>
                {cards.length > 0 && (
                  <span className="text-[10px] font-bold text-gray-600">{cards.length}</span>
                )}
              </div>

              {/* Cards + drop zone */}
              <div
                className={`flex min-h-10 flex-1 flex-col gap-2 rounded-lg border border-dashed p-1 transition-colors ${
                  isTarget ? 'border-gray-500 bg-gray-800/20' : 'border-transparent'
                }`}
              >
                {cards.map((record) => (
                  <AppCard
                    key={record.id}
                    record={record}
                    onDragStart={() => {
                      dragId.current = record.id
                    }}
                    onDragEnd={() => {
                      dragId.current = null
                      setDragOver(null)
                    }}
                    onDelete={() => void applicationStorage.remove(record.id)}
                    onOpen={() => setSelectedId(record.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
