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

export default function CVUpload() {
  const [status, setStatus] = useState<Status>('loading')
  const [cv, setCv] = useState<CvState | null>(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [showText, setShowText] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    cvStorage.get().then((record) => {
      if (record) {
        setCv({ filename: record.filename, text: record.text, parsedAt: record.parsedAt })
        setStatus('done')
      } else {
        setStatus('idle')
      }
    })
  }, [])

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      setStatus('error')
      return
    }
    setStatus('parsing')
    setError('')
    try {
      const text = await parsePdfToText(file)
      const record = { filename: file.name, text, parsedAt: Date.now() }
      await cvStorage.set(record)
      setCv(record)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PDF.')
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
    return <div className="p-4 text-sm text-gray-600">Loading…</div>
  }

  return (
    <section className="p-4 space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Resume</h2>

      {status === 'done' && cv ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 space-y-1">
            <p className="font-mono text-sm text-gray-100 truncate" title={cv.filename}>
              {cv.filename}
            </p>
            <p className="font-mono text-xs text-gray-500">
              {cv.text.length.toLocaleString()} chars
            </p>
            <button
              onClick={() => {
                void cvStorage.clear()
                setCv(null)
                setStatus('idle')
                setShowText(false)
              }}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              Replace
            </button>
          </div>

          <button
            onClick={() => setShowText((v) => !v)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            {showText ? '▲ Hide parsed text' : '▼ View parsed text'}
          </button>

          {showText && (
            <pre className="max-h-48 overflow-y-auto rounded border border-gray-800 bg-gray-900 p-2 font-mono text-xs text-gray-400 whitespace-pre-wrap break-words">
              {cv.text.slice(0, 2000)}
              {cv.text.length > 2000 ? '\n…' : ''}
            </pre>
          )}
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => {
              if (status !== 'parsing') inputRef.current?.click()
            }}
            className={`select-none cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? 'border-sky-500 bg-sky-950/10'
                : 'border-gray-700 hover:border-gray-600'
            } ${status === 'parsing' ? 'pointer-events-none opacity-60' : ''}`}
          >
            {status === 'parsing' ? (
              <p className="text-sm text-gray-400">Parsing PDF…</p>
            ) : (
              <>
                <p className="text-sm text-gray-300">Drop your PDF resume here</p>
                <p className="mt-1 text-xs text-gray-600">or click to browse</p>
              </>
            )}
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-400">{error}</p>
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
