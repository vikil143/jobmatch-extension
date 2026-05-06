import { useState } from 'react'
import { useTailoredResume, type ValidatedTailoredResume } from '../hooks/useTailoredResume'
import type { ApplicationRecord } from '../../types/jobs'

interface Props {
  record: ApplicationRecord
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function providerLabel(name: string | null): string {
  if (name === 'prompt-api') return 'on-device AI (Prompt API)'
  if (name === 'gemini-api') return 'Gemini API'
  return 'AI'
}

function copyAsMarkdown(tailored: ValidatedTailoredResume, record: ApplicationRecord) {
  const lines: string[] = [
    `# Resume Tailored for: ${record.title} @ ${record.company}`,
    `*Generated ${new Date(tailored.generatedAt).toLocaleDateString()}*`,
    '',
    '## Positioning Summary',
    tailored.summary,
    '',
    '## Bullet Rewrites',
  ]
  for (const rw of tailored.bulletRewrites) {
    const finalText = tailored.userEdits[rw.id] ?? rw.suggested
    lines.push(`\n**Original:** ${rw.original}`)
    lines.push(`**Suggested:** ${finalText}`)
    lines.push(`*${rw.rationale}*`)
  }
  if (tailored.emphasis.length) {
    lines.push('', '## Lead With These', ...tailored.emphasis.map((e) => `- ${e}`))
  }
  if (tailored.deemphasis.length) {
    lines.push('', '## Trim or Remove', ...tailored.deemphasis.map((d) => `- ~~${d}~~`))
  }
  if (tailored.keywordsToWeaveIn.length) {
    lines.push('', '## Keywords to Weave In', tailored.keywordsToWeaveIn.join(', '))
  }
  if (tailored.genuineGaps.length) {
    lines.push(
      '',
      '## Gaps to Address in Cover Letter',
      ...tailored.genuineGaps.map((g) => `- ${g}`),
    )
  }
  void navigator.clipboard.writeText(lines.join('\n'))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BulletRowProps {
  original: string
  suggested: string
  rationale: string
  id: string
  hallucinated: boolean
  suspiciousExpansion: boolean
  editedValue: string | undefined
  onEdit: (id: string, value: string) => void
}

function BulletRow({
  original,
  suggested,
  rationale,
  id,
  hallucinated,
  suspiciousExpansion,
  editedValue,
  onEdit,
}: BulletRowProps) {
  const [editing, setEditing] = useState(false)
  const displayText = editedValue ?? suggested

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 space-y-2">
      {hallucinated && (
        <div className="flex items-start gap-1.5 rounded border border-rose-800/60 bg-rose-950/30 px-2 py-1.5 text-[10px] text-rose-400">
          <span className="mt-px shrink-0">⚠</span>
          <span>Could not verify this matches your resume. The AI may have fabricated the source text.</span>
        </div>
      )}
      {suspiciousExpansion && !hallucinated && (
        <div className="flex items-start gap-1.5 rounded border border-amber-800/60 bg-amber-950/20 px-2 py-1.5 text-[10px] text-amber-400">
          <span className="mt-px shrink-0">⚠</span>
          <span>Review carefully — this rewrite is significantly longer than the original.</span>
        </div>
      )}

      {/* Stacked diff */}
      <div className="space-y-1">
        <p className="font-mono text-[11px] leading-relaxed text-gray-500 line-through decoration-gray-700">
          {original}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-700">→</span>
          {editing ? (
            <textarea
              autoFocus
              className="w-full resize-none rounded border border-sky-700/60 bg-gray-800 px-2 py-1 font-mono text-[11px] leading-relaxed text-sky-300 outline-none"
              rows={3}
              value={displayText}
              onChange={(e) => onEdit(id, e.target.value)}
              onBlur={() => setEditing(false)}
            />
          ) : (
            <p
              className="flex-1 font-mono text-[11px] leading-relaxed text-sky-300"
              onDoubleClick={() => setEditing(true)}
            >
              {displayText}
              {editedValue !== undefined && (
                <span className="ml-1.5 font-sans text-[9px] text-sky-600">[edited]</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] italic text-gray-600 flex-1">{rationale}</p>
        <button
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 rounded px-2 py-0.5 text-[10px] font-medium text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-300"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export default function TailoredResumePanel({ record }: Props) {
  const { tailored, isGenerating, error, rawStream, tokenCount, providerName, generate, cancel, save } =
    useTailoredResume(record.id)

  const [privacyDismissed, setPrivacyDismissed] = useState(false)
  const [copiedMd, setCopiedMd] = useState(false)
  const [showRaw, setShowRaw] = useState(false)

  function handleEdit(id: string, value: string) {
    if (!tailored) return
    const newEdits = { ...tailored.userEdits, [id]: value }
    void save(newEdits)
  }

  function handleRegenerate() {
    if (tailored && Object.keys(tailored.userEdits).length > 0) {
      if (!confirm('You have edited suggestions that will be lost. Regenerate anyway?')) return
    }
    void generate()
  }

  function handleCopyMd() {
    if (!tailored) return
    copyAsMarkdown(tailored, record)
    setCopiedMd(true)
    setTimeout(() => setCopiedMd(false), 2000)
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (!tailored && !isGenerating && !error) {
    return (
      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-300">Tailored Resume</p>
          <p className="text-[11px] text-gray-600">
            No tailored resume yet for this role.
          </p>
        </div>

        <button
          onClick={() => void generate()}
          className="w-full rounded-lg border border-sky-700/60 bg-sky-950/20 py-2 text-xs font-semibold text-sky-400 transition-colors hover:bg-sky-950/40"
        >
          Generate Tailored Resume
        </button>

        <p className="text-[10px] text-gray-700">
          {providerName === 'prompt-api'
            ? 'Uses on-device AI. Nothing is sent to any server.'
            : 'Will use ~3 000 tokens of your Gemini free tier (15 req/min).'}
        </p>
      </div>
    )
  }

  // ── Generating ────────────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-500" />
          <span className="text-xs font-semibold text-sky-400">
            Generating{tokenCount > 0 ? ` — ~${tokenCount} tokens received` : '…'}
          </span>
        </div>

        <button
          onClick={cancel}
          className="rounded border border-gray-700/60 px-3 py-1 text-[11px] text-gray-500 transition-colors hover:border-rose-700/60 hover:text-rose-400"
        >
          Cancel
        </button>

        {rawStream && (
          <div>
            <button
              onClick={() => setShowRaw((v) => !v)}
              className="text-[10px] text-gray-700 hover:text-gray-500"
            >
              {showRaw ? '▲ Hide raw output' : '▼ Show raw output'}
            </button>
            {showRaw && (
              <pre className="mt-2 max-h-40 overflow-y-auto rounded bg-gray-900 p-2 font-mono text-[10px] leading-relaxed text-gray-500 whitespace-pre-wrap break-all">
                {rawStream}
              </pre>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && !tailored) {
    return (
      <div className="space-y-3 p-4">
        <div className="rounded border border-rose-800/60 bg-rose-950/30 p-3 text-[11px] text-rose-400">
          {error}
        </div>
        <button
          onClick={() => void generate()}
          className="rounded border border-gray-700/60 px-3 py-1.5 text-[11px] text-gray-400 transition-colors hover:border-sky-700/60 hover:text-sky-400"
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (!tailored) return null

  return (
    <div className="space-y-5 p-4">
      {/* Privacy note */}
      {!privacyDismissed && (
        <div className="flex items-center justify-between gap-2 rounded border border-gray-800/60 bg-gray-900/40 px-3 py-1.5 text-[10px] text-gray-600">
          <span>
            {tailored.provider === 'prompt-api'
              ? 'Generated entirely on your device. Nothing was sent to any server.'
              : `Your CV and this JD were sent to ${providerLabel(tailored.provider)}.`}
          </span>
          <button
            onClick={() => setPrivacyDismissed(true)}
            className="shrink-0 text-gray-700 hover:text-gray-500"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error banner (when we have a result but a subsequent action errored) */}
      {error && (
        <div className="rounded border border-rose-800/60 bg-rose-950/30 p-2 text-[11px] text-rose-400">
          {error}
        </div>
      )}

      {/* a) Positioning summary */}
      <section>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
          Positioning Summary
        </p>
        <blockquote className="rounded-r border-l-2 border-sky-700 bg-sky-950/20 px-3 py-2 text-[11px] leading-relaxed text-gray-300 italic">
          {tailored.summary}
        </blockquote>
      </section>

      {/* b) Bullet rewrites */}
      {tailored.bulletRewrites.length > 0 && (
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
            Bullet Rewrites
          </p>
          <div className="space-y-2">
            {tailored.bulletRewrites.map((rw) => (
              <BulletRow
                key={rw.id}
                {...rw}
                editedValue={tailored.userEdits[rw.id]}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </section>
      )}

      {/* c) Lead with these */}
      {tailored.emphasis.length > 0 && (
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
            Lead With These
          </p>
          <ul className="space-y-1">
            {tailored.emphasis.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-300">
                <span className="mt-0.5 text-emerald-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* d) Trim or remove */}
      {tailored.deemphasis.length > 0 && (
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
            Trim or Remove
          </p>
          <ul className="space-y-1">
            {tailored.deemphasis.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-gray-500 line-through decoration-gray-700"
              >
                <span className="mt-0.5 no-underline">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* e) Keywords to weave in */}
      {tailored.keywordsToWeaveIn.length > 0 && (
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
            Weave In These Keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tailored.keywordsToWeaveIn.map((kw, i) => (
              <span
                key={i}
                className="rounded-full border border-violet-800/50 bg-violet-950/30 px-2 py-0.5 text-[10px] text-violet-300"
              >
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* f) Honest gaps */}
      {tailored.genuineGaps.length > 0 && (
        <section>
          <div className="rounded border border-amber-800/50 bg-amber-950/20 p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-500">
              Honest Gaps to Address
            </p>
            <p className="text-[10px] text-amber-700">
              These are in the JD but not your resume. Don't lie — address them in your cover letter or as learning goals.
            </p>
            <ul className="space-y-1">
              {tailored.genuineGaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-400">
                  <span className="mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleRegenerate}
          className="flex-1 rounded border border-gray-700/60 py-1.5 text-[11px] text-gray-500 transition-colors hover:border-sky-700/60 hover:text-sky-400"
        >
          Regenerate
        </button>
        <button
          onClick={handleCopyMd}
          className="flex-1 rounded border border-gray-700/60 py-1.5 text-[11px] text-gray-500 transition-colors hover:border-violet-700/60 hover:text-violet-400"
        >
          {copiedMd ? 'Copied ✓' : 'Copy as Markdown'}
        </button>
      </div>

      <p className="text-[9px] text-gray-800 text-center">
        Generated {new Date(tailored.generatedAt).toLocaleString()}
      </p>
    </div>
  )
}
