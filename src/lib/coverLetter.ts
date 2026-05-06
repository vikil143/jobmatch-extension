const GEMINI_KEY_STORAGE = 'settings:gemini-key'

// Chrome Prompt API (Gemini Nano, on-device) — experimental API
interface ChromeAICapabilities {
  available: 'no' | 'readily' | 'after-download'
}
interface ChromeAISession {
  prompt(text: string): Promise<string>
  destroy(): void
}
interface ChromeAILanguageModel {
  capabilities(): Promise<ChromeAICapabilities>
  create(opts?: { systemPrompt?: string }): Promise<ChromeAISession>
}
interface ChromeAI {
  languageModel?: ChromeAILanguageModel
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
  error?: { message?: string }
}

export const geminiKeyStorage = {
  async get(): Promise<string | null> {
    const result = await chrome.storage.local.get(GEMINI_KEY_STORAGE)
    return (result[GEMINI_KEY_STORAGE] as string) ?? null
  },
  async set(key: string): Promise<void> {
    await chrome.storage.local.set({ [GEMINI_KEY_STORAGE]: key })
  },
  async clear(): Promise<void> {
    await chrome.storage.local.remove(GEMINI_KEY_STORAGE)
  },
}

function buildPrompt(cvText: string, jdText: string, jobTitle: string, company: string): string {
  return `Write a professional cover letter for the following job application.

Job Title: ${jobTitle || 'the position'}
Company: ${company || 'the company'}

Job Description:
${jdText.slice(0, 3000)}

My Resume/CV:
${cvText.slice(0, 3000)}

Write a concise, compelling cover letter (3-4 paragraphs). Highlight how my skills match the role. Use a professional but personable tone. Start directly with "Dear Hiring Manager," or a similar salutation. Do not include a signature block.`
}

export type CoverLetterResult =
  | { status: 'ok'; text: string; source: 'on-device' | 'gemini-api' }
  | { status: 'no-key' }
  | { status: 'error'; message: string }

export async function generateCoverLetter(
  cvText: string,
  jdText: string,
  jobTitle: string,
  company: string,
): Promise<CoverLetterResult> {
  const prompt = buildPrompt(cvText, jdText, jobTitle, company)

  // 1. Try Chrome Prompt API (Gemini Nano, on-device)
  try {
    const ai = (window as Window & { ai?: ChromeAI }).ai
    const caps = await ai?.languageModel?.capabilities()
    if (caps && caps.available !== 'no') {
      const session = await ai!.languageModel!.create({
        systemPrompt: 'You are an expert professional cover letter writer.',
      })
      const text = await session.prompt(prompt)
      session.destroy()
      if (text.trim()) return { status: 'ok', text: text.trim(), source: 'on-device' }
    }
  } catch {
    // Chrome Prompt API unavailable or failed — fall through
  }

  // 2. Fall back to Gemini REST API
  const apiKey = await geminiKeyStorage.get()
  if (!apiKey) return { status: 'no-key' }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      },
    )
    const data = (await res.json()) as GeminiResponse
    if (!res.ok) {
      return { status: 'error', message: data.error?.message ?? `HTTP ${res.status}` }
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text.trim()) return { status: 'error', message: 'Empty response from Gemini.' }
    return { status: 'ok', text: text.trim(), source: 'gemini-api' }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Network error.' }
  }
}
