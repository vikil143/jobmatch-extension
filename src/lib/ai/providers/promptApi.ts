import type { AIProvider, GenerateOptions } from '../types'

interface LanguageModelSession {
  promptStreaming(input: string): ReadableStream<string>
  destroy(): void
}

interface LanguageModelFactory {
  availability(): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>
  create(options?: {
    initialPrompts?: Array<{ role: 'system' | 'user'; content: string }>
    temperature?: number
    topK?: number
  }): Promise<LanguageModelSession>
}

declare global {
  interface Window {
    LanguageModel?: LanguageModelFactory
  }
}

export let promptApiDownloadHint = false

export const promptApiProvider: AIProvider = {
  name: 'prompt-api',

  async isAvailable(): Promise<boolean> {
    const status = await window.LanguageModel?.availability().catch(() => 'unavailable')
    if (status === 'downloadable') {
      promptApiDownloadHint = true
    }
    return status === 'available' || status === 'downloadable'
  },

  async *generateStream(opts: GenerateOptions): AsyncIterable<string> {
    const { systemPrompt, userPrompt, temperature = 0.7, signal } = opts

    const session = await window.LanguageModel!.create({
      initialPrompts: [{ role: 'system', content: systemPrompt }],
      temperature,
      topK: 3,
    })

    try {
      const stream = session.promptStreaming(userPrompt)
      const reader = stream.getReader()

      // Chrome Prompt API may yield cumulative text (each chunk is the entire
      // output up to that point) or deltas, depending on Chrome version.
      // We detect cumulative mode by checking if the new chunk starts with
      // the accumulated output, and only yield the new portion.
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done || signal?.aborted) break

        if (value.startsWith(accumulated)) {
          const delta = value.slice(accumulated.length)
          accumulated = value
          if (delta) yield delta
        } else {
          accumulated += value
          yield value
        }
      }
    } finally {
      session.destroy()
    }
  },
}
