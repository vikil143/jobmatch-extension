import { z } from 'zod'
import type { TailoredResume, BulletRewrite } from '../../../types/jobs'

const BulletRewriteRawSchema = z.object({
  original: z.string().min(1),
  suggested: z.string().min(1),
  rationale: z.string().min(1),
})

const TailoredResumeRawSchema = z.object({
  summary: z.string().min(1),
  bulletRewrites: z.array(BulletRewriteRawSchema),
  emphasis: z.array(z.string()),
  deemphasis: z.array(z.string()),
  keywordsToWeaveIn: z.array(z.string()),
  genuineGaps: z.array(z.string()),
})

export interface BulletRewriteValidated extends BulletRewrite {
  /** original text not found in CV — LLM may have hallucinated the source */
  hallucinated: boolean
  /** suggested is >1.5× longer than original — review for fabricated content */
  suspiciousExpansion: boolean
}

export interface ValidatedTailoredResume extends Omit<TailoredResume, 'bulletRewrites'> {
  bulletRewrites: BulletRewriteValidated[]
}

function normalizeWs(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Strip JSON markdown fences the LLM sometimes adds. */
function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

/**
 * Parse and validate the raw LLM JSON response.
 * Returns a ValidatedTailoredResume with hallucination/expansion flags on each bullet.
 * Throws a user-readable Error on parse or schema failure.
 */
export function parseTailoredResumeResponse(
  rawJson: string,
  cvText: string,
): Omit<ValidatedTailoredResume, 'generatedAt' | 'provider' | 'userEdits'> {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripFences(rawJson))
  } catch {
    throw new Error('AI returned invalid JSON. Please retry.')
  }

  const result = TailoredResumeRawSchema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues.map((i) => i.message).join('; ')
    throw new Error(`AI response missing required fields: ${issues}`)
  }

  const normalizedCv = normalizeWs(cvText)

  const bulletRewrites: BulletRewriteValidated[] = result.data.bulletRewrites.map((rw, i) => ({
    id: `bw-${i}-${Date.now()}`,
    ...rw,
    hallucinated: !normalizedCv.includes(normalizeWs(rw.original)),
    suspiciousExpansion: rw.suggested.length / Math.max(rw.original.length, 1) > 1.5,
  }))

  return {
    summary: result.data.summary,
    bulletRewrites,
    emphasis: result.data.emphasis,
    deemphasis: result.data.deemphasis,
    keywordsToWeaveIn: result.data.keywordsToWeaveIn,
    genuineGaps: result.data.genuineGaps,
  }
}

/**
 * Re-attach validation flags to a stored TailoredResume (loaded from chrome.storage).
 * Run this on load so flags reflect the current CV state.
 */
export function addValidationFlags(
  resume: TailoredResume,
  cvText: string,
): ValidatedTailoredResume {
  const normalizedCv = normalizeWs(cvText)
  return {
    ...resume,
    bulletRewrites: resume.bulletRewrites.map((rw) => ({
      ...rw,
      hallucinated: !normalizedCv.includes(normalizeWs(rw.original)),
      suspiciousExpansion: rw.suggested.length / Math.max(rw.original.length, 1) > 1.5,
    })),
  }
}

/** Strip validation flags before persisting to chrome.storage. */
export function toStoredResume(validated: ValidatedTailoredResume): TailoredResume {
  return {
    ...validated,
    bulletRewrites: validated.bulletRewrites.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ hallucinated: _h, suspiciousExpansion: _s, ...rw }) => rw,
    ),
  }
}
