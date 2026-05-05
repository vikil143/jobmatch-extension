export function termFrequency(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1)
  const total = tokens.length || 1
  const tf = new Map<string, number>()
  for (const [term, count] of counts) tf.set(term, count / total)
  return tf
}

export function cosineSimilarity(
  tfA: Map<string, number>,
  tfB: Map<string, number>
): number {
  let dot = 0
  let magA = 0
  let magB = 0

  for (const [term, valA] of tfA) {
    magA += valA * valA
    const valB = tfB.get(term)
    if (valB !== undefined) dot += valA * valB
  }
  for (const [, valB] of tfB) magB += valB * valB

  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}
