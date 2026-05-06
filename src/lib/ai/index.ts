import type { AIProvider } from './types'
import { promptApiProvider } from './providers/promptApi'
import { geminiProvider } from './providers/gemini'

type ProviderPreference = 'auto' | 'prompt-api' | 'gemini-api'

const PREF_KEY = 'ai.preferredProvider'
const PRIORITY_ORDER: AIProvider[] = [promptApiProvider, geminiProvider]

export async function getActiveProvider(): Promise<AIProvider | null> {
  const result = await chrome.storage.local.get(PREF_KEY)
  const pref = (result[PREF_KEY] as ProviderPreference | undefined) ?? 'auto'

  if (pref !== 'auto') {
    const forced = PRIORITY_ORDER.find((p) => p.name === pref)
    if (forced && (await forced.isAvailable())) return forced
    // Forced provider not available — fall through to auto
  }

  for (const provider of PRIORITY_ORDER) {
    if (await provider.isAvailable()) return provider
  }

  return null
}

export { promptApiProvider, geminiProvider }
export type { AIProvider, ProviderPreference }
export * from './types'
