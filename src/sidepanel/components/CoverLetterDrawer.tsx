import { useState, useEffect, useRef } from 'react'
import { generateCoverLetter } from '../../lib/coverLetter'

interface Props {
  open: boolean
  onClose: () => void
  cvText: string
  jdText: string
  jobTitle: string
  company: string
  onOpenSettings: () => void
}

type State =
  | { phase: 'loading' }
  | { phase: 'done'; text: string; source: 'on-device' | 'gemini-api' }
  | { phase: 'no-key' }
  | { phase: 'error'; message: string }

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

export default function CoverLetterDrawer({
  open,
  onClose,
  cvText,
  jdText,
  jobTitle,
  company,
  onOpenSettings,
}: Props) {
  const [state, setState] = useState<State>({ phase: 'loading' })
  const [copied, setCopied] = useState(false)
  const [editedText, setEditedText] = useState('')
  const generatedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      generatedRef.current = false
      setState({ phase: 'loading' })
      setEditedText('')
      setCopied(false)
      return
    }
    if (generatedRef.current) return
    generatedRef.current = true
    void run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function run() {
    setState({ phase: 'loading' })
    const result = await generateCoverLetter(cvText, jdText, jobTitle, company)
    if (result.status === 'ok') {
      setState({ phase: 'done', text: result.text, source: result.source })
      setEditedText(result.text)
    } else if (result.status === 'no-key') {
      setState({ phase: 'no-key' })
    } else {
      setState({ phase: 'error', message: result.message })
    }
  }

  function handleRetry() {
    generatedRef.current = false
    generatedRef.current = true
    void run()
  }

  async function handleCopy() {
    const text = state.phase === 'done' ? editedText : ''
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-[#111] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Cover Letter</h2>
            {state.phase === 'done' && (
              <p className="mt-0.5 text-[10px] text-gray-600">
                {state.source === 'on-device' ? 'Generated on-device (Gemini Nano)' : 'Generated via Gemini API'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {state.phase === 'done' && (
              <>
                <button
                  onClick={handleRetry}
                  className="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-300"
                  title="Regenerate"
                >
                  <RefreshIcon />
                </button>
                <button
                  onClick={() => void handleCopy()}
                  className="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-300"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <CopyIcon />
                  )}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-300"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {state.phase === 'loading' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-sky-500" />
              <p className="text-xs text-gray-500">Drafting your cover letter…</p>
            </div>
          )}

          {state.phase === 'done' && (
            <textarea
              className="flex-1 resize-none bg-transparent p-4 text-sm leading-relaxed text-gray-200 outline-none placeholder:text-gray-700"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              spellCheck
            />
          )}

          {state.phase === 'no-key' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-300">Gemini API key required</p>
                <p className="mt-1 text-xs text-gray-600">
                  Chrome's on-device AI isn't available. Add a free Gemini API key in Settings to generate cover letters.
                </p>
              </div>
              <button
                onClick={() => { onClose(); onOpenSettings() }}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
              >
                Open Settings
              </button>
            </div>
          )}

          {state.phase === 'error' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <svg className="h-8 w-8 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-300">Generation failed</p>
                <p className="mt-1 text-xs text-gray-600">{state.message}</p>
              </div>
              <button
                onClick={handleRetry}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-200"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Footer copy bar */}
        {state.phase === 'done' && (
          <div className="border-t border-gray-800 px-4 py-3">
            <button
              onClick={() => void handleCopy()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
            >
              <CopyIcon />
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
