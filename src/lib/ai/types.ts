export interface GenerateOptions {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxOutputTokens?: number
  signal?: AbortSignal
}

export interface AIProvider {
  name: 'prompt-api' | 'gemini-api'
  isAvailable(): Promise<boolean>
  generateStream(opts: GenerateOptions): AsyncIterable<string>
}

export class NoProviderError extends Error {
  readonly friendlyMessage =
    'No AI provider available. Add a Gemini API key in Settings to get started.'
  constructor() {
    super('NoProviderError')
    this.name = 'NoProviderError'
  }
}

export class RateLimitError extends Error {
  readonly friendlyMessage =
    'Rate limit reached. Gemini free tier allows 15 requests/min — try again in a moment.'
  constructor() {
    super('RateLimitError')
    this.name = 'RateLimitError'
  }
}

export class InvalidKeyError extends Error {
  readonly friendlyMessage =
    'Invalid or missing API key. Check your Gemini API key in Settings.'
  constructor() {
    super('InvalidKeyError')
    this.name = 'InvalidKeyError'
  }
}

export class ContextLengthError extends Error {
  readonly friendlyMessage =
    'Input too long. Try with a shorter resume or job description.'
  constructor() {
    super('ContextLengthError')
    this.name = 'ContextLengthError'
  }
}

export class NetworkError extends Error {
  readonly friendlyMessage: string
  constructor(detail: string) {
    super(detail)
    this.name = 'NetworkError'
    this.friendlyMessage = `Network error: ${detail}. Check your internet connection.`
  }
}

export type AIError =
  | NoProviderError
  | RateLimitError
  | InvalidKeyError
  | ContextLengthError
  | NetworkError

export function isFriendlyError(e: unknown): e is { friendlyMessage: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'friendlyMessage' in e &&
    typeof (e as Record<string, unknown>).friendlyMessage === 'string'
  )
}
