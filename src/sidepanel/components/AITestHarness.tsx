import { useState, useRef } from 'react'
import { useAIGeneration } from '../../lib/ai/useAIGeneration'
import { isFriendlyError } from '../../lib/ai/types'

export default function AITestHarness() {
  const [prompt, setPrompt] = useState('')
  const startTimeRef = useRef<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const { generate, output, isStreaming, error, providerUsed, cancel } = useAIGeneration()

  const wordCount = output.split(/\s+/).filter(Boolean).length
  const tps = elapsed > 0 ? (wordCount / elapsed).toFixed(1) : '—'

  async function handleGenerate() {
    startTimeRef.current = Date.now()
    setElapsed(0)
    await generate({
      systemPrompt: 'You are a helpful assistant. Be concise.',
      userPrompt: prompt,
    })
    if (startTimeRef.current) {
      setElapsed((Date.now() - startTimeRef.current) / 1000)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-amber-800/40 bg-amber-950/10 p-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600/80">
        AI Test Harness
      </h4>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a test prompt…"
        rows={3}
        className="w-full resize-none rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-amber-700/60 focus:outline-none"
      />

      <div className="flex gap-2">
        <button
          onClick={() => void handleGenerate()}
          disabled={isStreaming || !prompt.trim()}
          className="flex-1 rounded bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-800/50 disabled:opacity-40"
        >
          {isStreaming ? 'Generating…' : 'Generate'}
        </button>
        {isStreaming && (
          <button
            onClick={cancel}
            className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
          >
            Cancel
          </button>
        )}
      </div>

      {(output || error) && (
        <div className="space-y-1.5">
          {providerUsed && (
            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <span>Provider: {providerUsed}</span>
              {!isStreaming && output && <span>{tps} words/s</span>}
            </div>
          )}

          {error ? (
            <div className="rounded border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-400">
              {isFriendlyError(error) ? error.friendlyMessage : error.message}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded border border-gray-800 bg-gray-900/50 p-2 text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">
              {output}
              {isStreaming && (
                <span className="ml-0.5 inline-block h-3 w-1 animate-pulse rounded-sm bg-amber-500" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
