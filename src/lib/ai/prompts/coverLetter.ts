import type { CoverLetterTone, CoverLetterLength } from '../../../types/jobs'

export type RefinementType = 'shorter' | 'more-confident' | 'less-corporate'

export const TARGET_WORDS: Record<CoverLetterLength, number> = {
  short: 150,
  medium: 300,
  long: 450,
}

interface CoverLetterPromptOptions {
  cvText: string
  jdText: string
  tone: CoverLetterTone
  length: CoverLetterLength
  candidateName: string
  tailoredSummary?: string
  genuineGaps?: string[]
  refinement?: { type: RefinementType; previousContent: string }
}

export interface CoverLetterPrompts {
  systemPrompt: string
  userPrompt: string
}

export function buildCoverLetterPrompt(opts: CoverLetterPromptOptions): CoverLetterPrompts {
  const { cvText, jdText, tone, length, candidateName, tailoredSummary, genuineGaps, refinement } = opts
  const targetWords = TARGET_WORDS[length]

  if (refinement) {
    let instruction: string
    if (refinement.type === 'shorter') {
      instruction = `Rewrite the following cover letter to be approximately ${targetWords} words. Preserve the most impactful points; cut padding and repetition.`
    } else if (refinement.type === 'more-confident') {
      instruction =
        'Rewrite the following cover letter to sound more confident and decisive. Use active voice and assertive language. Do not overstate qualifications — confidence comes from precision, not exaggeration.'
    } else {
      instruction =
        'Rewrite the following cover letter to sound more human and genuine. Keep the same facts and structure but strip corporate boilerplate, hollow phrases, and template-speak. Make it feel like a real person wrote it.'
    }

    return {
      systemPrompt: `You are refining a cover letter.\n\n${instruction}\n\nRules:\n- Do not add experience, employers, or skills not present in the original letter.\n- Output the letter only — no preamble, no meta-commentary.\n- Use '${candidateName}' in the sign-off.`,
      userPrompt: `LETTER TO REFINE:\n${refinement.previousContent}`,
    }
  }

  const toneGuide: Record<CoverLetterTone, string> = {
    professional:
      'formal, polished, and confident — suitable for conservative industries; precise word choice',
    conversational:
      'warm, direct, and clear — reads like a smart human wrote it, not a template; natural sentence rhythm',
    enthusiastic:
      'energetic and forward-looking — genuine excitement for the role; avoid hollow superlatives like "passionate" or "thrilled"',
  }

  const gapsSection =
    genuineGaps && genuineGaps.length > 0
      ? `\n\nGENUINE GAPS — in the JD but not in the resume. Address these honestly with growth framing (e.g. "I am actively developing…" or "While I have not yet…"). Never fabricate:\n${genuineGaps.map((g) => `- ${g}`).join('\n')}`
      : ''

  const summarySection = tailoredSummary
    ? `\n\nTAILORED POSITIONING (use as anchor for the opening paragraph):\n${tailoredSummary}`
    : ''

  const systemPrompt = `You are writing a personalized cover letter for a job application.

HARD RULES — no exceptions:
1. Use only experience, skills, and facts present in the candidate's resume. Never invent specifics.
2. If the JD requires something absent from the resume, address it honestly with growth framing. Never fabricate.
3. Tone: ${toneGuide[tone]}.
4. Target length: approximately ${targetWords} words. Do not pad. Stay within 20% of target.
5. Start directly with a strong opening line. Do not include a date, postal address block, or "Dear Hiring Manager".
6. Output the letter only — no preamble like "Here is your cover letter:", no closing meta-commentary.
7. Use '${candidateName}' in the sign-off.
8. Avoid hollow phrases: "I am excited to apply", "I am a perfect fit", "Please find attached", "I believe I would be a great asset".`

  const userPrompt = `CANDIDATE RESUME:\n${cvText}${summarySection}${gapsSection}\n\nJOB DESCRIPTION:\n${jdText}\n\nWrite the cover letter now.`

  return { systemPrompt, userPrompt }
}
