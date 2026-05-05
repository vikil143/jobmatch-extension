import ontology from '../../data/skills.json'

interface SkillEntry {
  id: string
  label: string
  aliases: string[]
  category: string
}

const skills = ontology as SkillEntry[]

// Precompile one regex per skill: matches the label and all aliases as whole words/phrases.
const skillPatterns: { id: string; regex: RegExp }[] = skills.map((skill) => {
  const terms = [skill.label, ...skill.aliases].map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )
  // Sort longest first so multi-word phrases match before substrings.
  terms.sort((a, b) => b.length - a.length)
  const pattern = terms.map((t) => `\\b${t}\\b`).join('|')
  return { id: skill.id, regex: new RegExp(pattern, 'i') }
})

export function extractSkills(text: string): Set<string> {
  const found = new Set<string>()
  for (const { id, regex } of skillPatterns) {
    if (regex.test(text)) found.add(id)
  }
  return found
}

export function skillLabel(id: string): string {
  return skills.find((s) => s.id === id)?.label ?? id
}
