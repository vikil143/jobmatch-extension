import { useState, useEffect, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { parsePdfToText } from '../../lib/parsers/pdf'
import { cvStorage } from '../../lib/storage'

type Status = 'loading' | 'idle' | 'parsing' | 'done' | 'error'

interface CvState {
  filename: string
  text: string
  parsedAt: number
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CVUpload() {
  const [status, setStatus] = useState<Status>('loading')
  const [cv, setCv] = useState<CvState | null>(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    cvStorage.get().then((record) => {
      if (record) {
        setCv({ filename: record.filename, text: record.text, parsedAt: record.parsedAt })
        setStatus('done')
      } else {
        setStatus('idle')
      }
    }).catch(() => setStatus('idle'))
  }, [])

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported. Please upload a .pdf file.')
      setStatus('error')
      return
    }
    if (file.size === 0) {
      setError('The file appears to be empty.')
      setStatus('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please upload a PDF under 10 MB.')
      setStatus('error')
      return
    }
    setStatus('parsing')
    setError('')
    try {
      const text = await parsePdfToText(file)
      if (!text.trim()) {
        setError('No readable text found in this PDF. It may be scanned or image-based.')
        setStatus('error')
        return
      }
      const record = { filename: file.name, text, parsedAt: Date.now() }
      await cvStorage.set(record)
      setCv(record)
      setStatus('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse PDF.'
      setError(msg.length > 120 ? 'Failed to read the PDF. Try re-saving it as a standard PDF.' : msg)
      setStatus('error')
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  if (status === 'loading') {
    return (
      <section className="p-4 space-y-3">
        <div className="h-3 w-16 rounded bg-gray-800 animate-pulse" />
        <div className="h-14 w-full rounded-lg bg-gray-900 animate-pulse" />
      </section>
    )
  }

  return (
    <section className="p-4 space-y-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">Resume</h2>

      {status === 'done' && cv ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-gray-100 truncate" title={cv.filename}>
                {cv.filename}
              </p>
              <p className="text-[11px] text-gray-500">
                {cv.text.length.toLocaleString()} chars · uploaded {formatDate(cv.parsedAt)}
              </p>
            </div>
            <button
              onClick={() => {
                void cvStorage.clear()
                setCv(null)
                setStatus('idle')
              }}
              className="shrink-0 rounded px-2 py-1 text-[11px] text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 transition-colors"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => { if (status !== 'parsing') inputRef.current?.click() }}
            className={`select-none cursor-pointer rounded-lg border-2 border-dashed py-8 px-4 text-center transition-all ${
              dragActive
                ? 'border-sky-500 bg-sky-950/20'
                : 'border-gray-700 hover:border-gray-600 hover:bg-gray-900/40'
            } ${status === 'parsing' ? 'pointer-events-none opacity-60' : ''}`}
          >
            {status === 'parsing' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Parsing resume…
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-center text-gray-600">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">Drop your PDF resume here</p>
                <p className="text-xs text-gray-600">or click to browse</p>
              </div>
            )}
          </div>

          {status === 'error' && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2.5 text-xs text-red-400">
              <span className="font-medium">Error: </span>{error}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={onFileChange}
          />
        </>
      )}
    </section>
  )
}
