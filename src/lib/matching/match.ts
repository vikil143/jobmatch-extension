import { extractSkills, skillLabel } from './skills'
import { tokenize } from './tokenizer'
import { termFrequency, cosineSimilarity } from './tfidf'
import type { MatchResult } from '../../types/jobs'

// Blends a semantic similarity score into an existing TF-cosine result.
// Weight shift: skills 40 %, TF-cosine 20 %, semantic 40 %.
export function blendSemanticScore(base: MatchResult, semSim: number): MatchResult {
  return {
    ...base,
    score: Math.round(40 * base.skillCoverage + 20 * base.keywordOverlap + 40 * semSim),
    semanticScore: semSim,
  }
}

export function computeMatch(cv: string, jd: string): MatchResult {
  const cvSkills = extractSkills(cv)
  const jdSkills = extractSkills(jd)

  const matched = [...jdSkills].filter((id) => cvSkills.has(id))
  const missing = [...jdSkills].filter((id) => !cvSkills.has(id))
  const extra = [...cvSkills].filter((id) => !jdSkills.has(id))

  const skillCoverage = jdSkills.size === 0 ? 0 : matched.length / jdSkills.size

  // Sort matched/missing by how often the skill label appears in the JD text.
  const jdLower = jd.toLowerCase()
  const freq = (id: string): number => {
    const label = skillLabel(id).toLowerCase()
    let count = 0
    let pos = 0
    while ((pos = jdLower.indexOf(label, pos)) !== -1) { count++; pos += label.length }
    return count
  }
  matched.sort((a, b) => freq(b) - freq(a))
  missing.sort((a, b) => freq(b) - freq(a))

  const jdTokens = tokenize(jd)
  const cvTokens = tokenize(cv)
  const keywordOverlap = cosineSimilarity(termFrequency(jdTokens), termFrequency(cvTokens))

  const score = Math.round(60 * skillCoverage + 40 * keywordOverlap)

  return {
    score,
    skillCoverage,
    keywordOverlap,
    matchedSkills: matched.map(skillLabel),
    missingSkills: missing.map(skillLabel),
    extraSkills: extra.map(skillLabel),
  }
}
