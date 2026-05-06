import { useState, useRef, useEffect } from 'react'
import { exportAllData, importAllData, clearAllData } from '../../lib/storage'
import { geminiKeyStorage } from '../../lib/coverLetter'

interface Props {
  open: boolean
  onClose: () => void
}

type Phase = 'idle' | 'confirming-clear' | 'working' | 'success' | 'error'

export default function SettingsDrawer({ open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  // Gemini API key state
  const [geminiKey, setGeminiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [keyPhase, setKeyPhase] = useState<'idle' | 'saving' | 'saved' | 'cleared'>('idle')

  useEffect(() => {
    if (!open) return
    void geminiKeyStorage.get().then((k) => setGeminiKey(k ?? ''))
  }, [open])

  async function handleSaveKey() {
    setKeyPhase('saving')
    await geminiKeyStorage.set(geminiKey.trim())
    setKeyPhase('saved')
    setTimeout(() => setKeyPhase('idle'), 2000)
  }

  async function handleClearKey() {
    await geminiKeyStorage.clear()
    setGeminiKey('')
    setKeyPhase('cleared')
    setTimeout(() => setKeyPhase('idle'), 2000)
  }

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

          {/* AI — Gemini API key */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">AI (Cover Letters)</h3>
            <p className="text-xs text-gray-600">
              Used only when Chrome's on-device AI is unavailable. Sent to Google's API only — never stored remotely by this extension.
            </p>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza…"
                  className="w-full rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 pr-9 text-sm text-gray-200 placeholder:text-gray-700 outline-none focus:border-sky-700"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                  tabIndex={-1}
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleSaveKey()}
                  disabled={!geminiKey.trim() || keyPhase === 'saving'}
                  className="flex-1 rounded-lg bg-sky-700/80 px-3 py-1.5 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-600 disabled:opacity-40"
                >
                  {keyPhase === 'saved' ? 'Saved!' : keyPhase === 'saving' ? 'Saving…' : 'Save key'}
                </button>
                {geminiKey && (
                  <button
                    onClick={() => void handleClearKey()}
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-400"
                  >
                    {keyPhase === 'cleared' ? 'Cleared' : 'Clear'}
                  </button>
                )}
              </div>
            </div>
          </div>

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
