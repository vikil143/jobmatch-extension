import type { AIProvider, GenerateOptions } from '../types'
import { RateLimitError, InvalidKeyError, NetworkError } from '../types'

const API_KEY_STORAGE = 'gemini.apiKey'
const GEMINI_MODEL = 'gemini-2.0-flash'
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
]

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> }
}

interface GeminiSSEPayload {
  candidates?: GeminiCandidate[]
}

export const geminiProvider: AIProvider = {
  name: 'gemini-api',

  async isAvailable(): Promise<boolean> {
    const result = await chrome.storage.local.get(API_KEY_STORAGE)
    const key = result[API_KEY_STORAGE] as string | undefined
    return typeof key === 'string' && key.startsWith('AIza') && key.length > 30
  },

  async *generateStream(opts: GenerateOptions): AsyncIterable<string> {
    const {
      systemPrompt,
      userPrompt,
      temperature = 0.7,
      maxOutputTokens = 2048,
      signal,
    } = opts

    const result = await chrome.storage.local.get(API_KEY_STORAGE)
    const apiKey = result[API_KEY_STORAGE] as string | undefined
    if (!apiKey) throw new InvalidKeyError()

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature, maxOutputTokens, topP: 0.95 },
      safetySettings: SAFETY_SETTINGS,
    }

    let response: Response
    try {
      response = await fetch(`${BASE_URL}&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      })
    } catch (e) {
      if (signal?.aborted) return
      throw new NetworkError(e instanceof Error ? e.message : 'fetch failed')
    }

    if (response.status === 429) throw new RateLimitError()
    if (response.status === 401 || response.status === 403) throw new InvalidKeyError()
    if (response.status === 503) throw new NetworkError('Gemini service temporarily unavailable — try again in a moment')
    if (!response.ok) throw new NetworkError(`HTTP ${response.status}`)

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return

        try {
          const json = JSON.parse(data) as GeminiSSEPayload
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
        } catch {
          // Malformed SSE chunk — skip
        }
      }
    }
  },
}
