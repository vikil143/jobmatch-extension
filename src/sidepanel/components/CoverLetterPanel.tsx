import { useState, useEffect, useRef } from 'react'
import { useCoverLetter } from '../hooks/useCoverLetter'
import { TARGET_WORDS } from '../../lib/ai/prompts/coverLetter'
import type { ApplicationRecord, CoverLetterTone, CoverLetterLength } from '../../types/jobs'
import type { RefinementType } from '../hooks/useCoverLetter'

interface Props {
  record: ApplicationRecord
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function wordCountBadgeClass(actual: number, target: number): string {
  return Math.abs(actual - target) / target > 0.25 ? 'text-rose-400' : 'text-gray-600'
}

// ── Chip components ───────────────────────────────────────────────────────────

function ToneChip({
  value,
  current,
  onClick,
  disabled,
}: {
  value: CoverLetterTone
  current: CoverLetterTone
  onClick: () => void
  disabled?: boolean
}) {
  const labels: Record<CoverLetterTone, string> = {
    professional: 'Professional',
    conversational: 'Conversational',
    enthusiastic: 'Enthusiastic',
  }
  const active = value === current
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-40 ${
        active
          ? 'border-sky-600 bg-sky-950/40 text-sky-300'
          : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
      }`}
    >
      {labels[value]}
    </button>
  )
}

function LengthChip({
  value,
  current,
  onClick,
  disabled,
}: {
  value: CoverLetterLength
  current: CoverLetterLength
  onClick: () => void
  disabled?: boolean
}) {
  const labels: Record<CoverLetterLength, string> = {
    short: 'Short ~150w',
    medium: 'Medium ~300w',
    long: 'Long ~450w',
  }
  const active = value === current
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-40 ${
        active
          ? 'border-violet-600 bg-violet-950/40 text-violet-300'
          : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
      }`}
    >
      {labels[value]}
    </button>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function CoverLetterPanel({ record }: Props) {
  const {
    coverLetter,
    isGenerating,
    error,
    streamContent,
    tokenCount,
    providerName,
    tone,
    length,
    setTone,
    setLength,
    generate,
    cancel,
    saveEdits,
    resetToAI,
  } = useCoverLetter(record.id)

  const [copiedType, setCopiedType] = useState<'copy' | 'plain' | null>(null)
  const [privacyDismissed, setPrivacyDismissed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const displayContent = coverLetter ? (coverLetter.userEdits ?? coverLetter.content) : ''

  // Auto-resize textarea to fit content
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [displayContent])

  function handleCopy() {
    void navigator.clipboard.writeText(coverLetter?.userEdits ?? coverLetter?.content ?? '')
    setCopiedType('copy')
    setTimeout(() => setCopiedType(null), 2000)
  }

  function handleCopyPlain() {
    const raw = coverLetter?.userEdits ?? coverLetter?.content ?? ''
    const plain = raw.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/#{1,6}\s/g, '')
    void navigator.clipboard.writeText(plain)
    setCopiedType('plain')
    setTimeout(() => setCopiedType(null), 2000)
  }

  function handleRegenerate() {
    if (coverLetter?.userEdits) {
      if (!confirm('You have edited the cover letter. Regenerate will replace your edits. Continue?')) return
    }
    void generate()
  }

  function handleRefinement(type: RefinementType) {
    void generate({ refinement: type })
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (!coverLetter && !isGenerating && !error) {
    return (
      <div className="space-y-4 border-t border-gray-800 p-4">
        <p className="text-xs font-semibold text-gray-300">Cover Letter</p>

        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-600">Tone</p>
          <div className="flex flex-wrap gap-1.5">
            {(['professional', 'conversational', 'enthusiastic'] as CoverLetterTone[]).map((t) => (
              <ToneChip key={t} value={t} current={tone} onClick={() => setTone(t)} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-600">Length</p>
          <div className="flex flex-wrap gap-1.5">
            {(['short', 'medium', 'long'] as CoverLetterLength[]).map((l) => (
              <LengthChip key={l} value={l} current={length} onClick={() => setLength(l)} />
            ))}
          </div>
        </div>

        <button
          onClick={() => void generate()}
          className="w-full rounded-lg border border-violet-700/60 bg-violet-950/20 py-2 text-xs font-semibold text-violet-400 transition-colors hover:bg-violet-950/40"
        >
          Generate Cover Letter
        </button>

        {!record.tailoredResume && (
          <p className="text-[10px] text-amber-700">
            Tip: generate a tailored resume first — the cover letter will use its positioning summary and honest gaps.
          </p>
        )}

        <p className="text-[10px] text-gray-700">
          {providerName === 'prompt-api'
            ? 'Uses on-device AI. Nothing leaves your device.'
            : 'Will use ~800 tokens of your Gemini free tier.'}
        </p>
      </div>
    )
  }

  // ── Generating ────────────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="space-y-3 border-t border-gray-800 p-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-violet-500" />
          <span className="text-xs font-semibold text-violet-400">
            Writing{tokenCount > 0 ? ` — ~${tokenCount} tokens` : '…'}
          </span>
        </div>

        {streamContent && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-4">
            <p
              className="text-sm leading-loose text-gray-300 whitespace-pre-wrap"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              {streamContent}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-[blink_1s_step-end_infinite] bg-violet-400 align-text-bottom" />
            </p>
          </div>
        )}

        <button
          onClick={cancel}
          className="rounded border border-gray-700/60 px-3 py-1 text-[11px] text-gray-500 transition-colors hover:border-rose-700/60 hover:text-rose-400"
        >
          Cancel
        </button>
      </div>
    )
  }

  // ── Error (no result yet) ─────────────────────────────────────────────────
  if (error && !coverLetter) {
    return (
      <div className="space-y-3 border-t border-gray-800 p-4">
        <p className="text-xs font-semibold text-gray-300">Cover Letter</p>
        <div className="rounded border border-rose-800/60 bg-rose-950/30 p-3 text-[11px] text-rose-400">
          {error}
        </div>
        <button
          onClick={() => void generate()}
          className="rounded border border-gray-700/60 px-3 py-1.5 text-[11px] text-gray-400 transition-colors hover:border-violet-700/60 hover:text-violet-400"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!coverLetter) return null

  const wordCount = countWords(displayContent)
  const targetWords = TARGET_WORDS[coverLetter.length]
  const wcClass = wordCountBadgeClass(wordCount, targetWords)
  const wcOffTarget = Math.abs(wordCount - targetWords) / targetWords > 0.25

  // ── Done ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 border-t border-gray-800 p-4">
      {/* Section header + privacy */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-300">Cover Letter</p>
        {!privacyDismissed && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-gray-700">
              {coverLetter.provider === 'prompt-api'
                ? 'Generated on-device'
                : `~${tokenCount > 0 ? tokenCount : Math.ceil(coverLetter.content.length / 4)} Gemini tokens`}
            </span>
            <button
              onClick={() => setPrivacyDismissed(true)}
              className="text-[9px] text-gray-700 hover:text-gray-500"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Tone + length selectors (change before regenerating) */}
      <div className="flex flex-wrap gap-1.5">
        {(['professional', 'conversational', 'enthusiastic'] as CoverLetterTone[]).map((t) => (
          <ToneChip key={t} value={t} current={tone} onClick={() => setTone(t)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(['short', 'medium', 'long'] as CoverLetterLength[]).map((l) => (
          <LengthChip key={l} value={l} current={length} onClick={() => setLength(l)} />
        ))}
      </div>

      {/* Stale error banner */}
      {error && (
        <div className="rounded border border-rose-800/60 bg-rose-950/30 p-2 text-[11px] text-rose-400">
          {error}
        </div>
      )}

      {/* Writing surface */}
      <div className="relative rounded-lg border border-gray-700/60 bg-gray-900/40">
        <textarea
          ref={textareaRef}
          value={displayContent}
          onChange={(e) => saveEdits(e.target.value)}
          className="w-full resize-none bg-transparent px-4 py-4 text-[13px] text-gray-200 outline-none"
          style={{
            fontFamily: "'Lora', Georgia, serif",
            lineHeight: '1.85',
            minHeight: '120px',
          }}
        />
        {coverLetter.userEdits !== null && (
          <span className="absolute right-2 top-2 rounded bg-gray-800 px-1.5 py-0.5 text-[9px] text-sky-600">
            edited
          </span>
        )}
      </div>

      {/* Word count + cost */}
      <div className="flex items-center justify-between">
        <span className={`font-mono text-[10px] ${wcClass}`}>
          {wordCount}w
          {wcOffTarget && (
            <span className="ml-1 text-rose-700">(target {targetWords}w)</span>
          )}
        </span>
        <span className="text-[9px] text-gray-700">
          {coverLetter.provider === 'prompt-api'
            ? 'Generated using on-device AI'
            : `Used ~${Math.ceil(coverLetter.content.length / 4)} tokens of your Gemini free tier today`}
        </span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleCopy}
          className="rounded border border-gray-700/60 py-1.5 text-[11px] text-gray-500 transition-colors hover:border-violet-700/60 hover:text-violet-400"
        >
          {copiedType === 'copy' ? 'Copied ✓' : 'Copy'}
        </button>
        <button
          onClick={handleCopyPlain}
          className="rounded border border-gray-700/60 py-1.5 text-[11px] text-gray-500 transition-colors hover:border-violet-700/60 hover:text-violet-400"
        >
          {copiedType === 'plain' ? 'Copied ✓' : 'Copy as plain text'}
        </button>
        <button
          onClick={handleRegenerate}
          className="rounded border border-gray-700/60 py-1.5 text-[11px] text-gray-500 transition-colors hover:border-sky-700/60 hover:text-sky-400"
        >
          Regenerate
        </button>
        {coverLetter.userEdits !== null && (
          <button
            onClick={() => void resetToAI()}
            className="rounded border border-gray-700/60 py-1.5 text-[11px] text-gray-500 transition-colors hover:border-amber-700/60 hover:text-amber-400"
          >
            Reset to AI version
          </button>
        )}
      </div>

      {/* Quick refinements */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.1em] text-gray-700">Quick refinements</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleRefinement('shorter')}
            className="rounded-full border border-gray-700 px-2.5 py-0.5 text-[10px] text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-400"
          >
            Make it shorter
          </button>
          <button
            onClick={() => handleRefinement('more-confident')}
            className="rounded-full border border-gray-700 px-2.5 py-0.5 text-[10px] text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-400"
          >
            Make it more confident
          </button>
          <button
            onClick={() => handleRefinement('less-corporate')}
            className="rounded-full border border-gray-700 px-2.5 py-0.5 text-[10px] text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-400"
          >
            Less corporate
          </button>
        </div>
      </div>

      <p className="text-center text-[9px] text-gray-800">
        Generated {new Date(coverLetter.generatedAt).toLocaleString()} · {coverLetter.tone} · {coverLetter.length}
      </p>
    </div>
  )
}
