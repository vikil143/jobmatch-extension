import { useState, useRef } from 'react'
import { exportAllData, importAllData, clearAllData } from '../../lib/storage'
import AISettings from './Settings'

interface Props {
  open: boolean
  onClose: () => void
}

type Phase = 'idle' | 'confirming-clear' | 'working' | 'success' | 'error'

export default function SettingsDrawer({ open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  async function handleExport() {
    setPhase('working')
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobmatch-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('Data exported.')
      setPhase('success')
    } catch {
      setMessage('Export failed.')
      setPhase('error')
    }
    setTimeout(() => setPhase('idle'), 3000)
  }

  function handleImportClick() {
    importRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhase('working')
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Record<string, unknown>
      if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        throw new Error('Invalid format')
      }
      await importAllData(data)
      setMessage('Data imported. Reloading…')
      setPhase('success')
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      setMessage('Import failed — file must be a valid JobMatch JSON export.')
      setPhase('error')
      setTimeout(() => setPhase('idle'), 4000)
    }
  }

  async function handleClear() {
    setPhase('working')
    try {
      await clearAllData()
      setMessage('All data cleared.')
      setPhase('success')
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      setMessage('Failed to clear data.')
      setPhase('error')
      setTimeout(() => setPhase('idle'), 3000)
    }
  }

  const busy = phase === 'working'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-[#111] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Settings</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-300"
            aria-label="Close settings"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* AI features */}
          <AISettings />

          {/* Data management */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">Data</h3>

            <button
              onClick={() => void handleExport()}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2.5 text-left transition-colors hover:border-gray-700 hover:bg-gray-900 disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <div>
                <p className="text-sm text-gray-200">Export data</p>
                <p className="text-xs text-gray-600">Download resume + history as JSON</p>
              </div>
            </button>

            <button
              onClick={handleImportClick}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2.5 text-left transition-colors hover:border-gray-700 hover:bg-gray-900 disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <div>
                <p className="text-sm text-gray-200">Import data</p>
                <p className="text-xs text-gray-600">Restore from a previous export</p>
              </div>
            </button>

            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => void handleImportFile(e)}
            />
          </div>

          {/* Danger zone */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-900">Danger zone</h3>

            {phase !== 'confirming-clear' ? (
              <button
                onClick={() => setPhase('confirming-clear')}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2.5 text-left transition-colors hover:border-red-800/60 hover:bg-red-950/40 disabled:opacity-50"
              >
                <svg className="h-4 w-4 shrink-0 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <div>
                  <p className="text-sm text-red-400">Clear all data</p>
                  <p className="text-xs text-red-900/80">Remove resume, history, and settings</p>
                </div>
              </button>
            ) : (
              <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-3 space-y-3">
                <p className="text-sm text-red-300">This will permanently delete your resume and job history. Are you sure?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleClear()}
                    disabled={busy}
                    className="flex-1 rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    Yes, clear everything
                  </button>
                  <button
                    onClick={() => setPhase('idle')}
                    className="flex-1 rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        {(phase === 'success' || phase === 'error' || phase === 'working') && (
          <div className={`border-t px-4 py-3 text-xs ${
            phase === 'success' ? 'border-emerald-900/40 bg-emerald-950/30 text-emerald-400' :
            phase === 'error' ? 'border-red-900/40 bg-red-950/30 text-red-400' :
            'border-gray-800 bg-gray-900 text-gray-400'
          }`}>
            {phase === 'working' ? 'Working…' : message}
          </div>
        )}
      </div>
    </>
  )
}
