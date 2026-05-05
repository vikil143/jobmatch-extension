import { STOPWORDS } from './stopwords'

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 1 && !/^\d+$/.test(t) && !STOPWORDS.has(t))
}
