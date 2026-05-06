import { useState, useEffect } from 'react'
import AITestHarness from './AITestHarness'
import { geminiProvider } from '../../lib/ai'
import type { ProviderPreference } from '../../lib/ai'
import { isFriendlyError } from '../../lib/ai/types'

const GEMINI_KEY_STORAGE = 'gemini.apiKey'
const PREF_KEY = 'ai.preferredProvider'

export default function AISettings() {
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [preference, setPreference] = useState<ProviderPreference>('auto')
  const [promptApiAvailable, setPromptApiAvailable] = useState<boolean | null>(null)
  const [promptApiDownload, setPromptApiDownload] = useState(false)
  const [keyPhase, setKeyPhase] = useState<'idle' | 'saving' | 'testing' | 'ok' | 'error'>('idle')
  const [keyMessage, setKeyMessage] = useState('')
  const [showDevTools, setShowDevTools] = useState(false)

  useEffect(() => {
    void (async () => {
      const result = await chrome.storage.local.get([GEMINI_KEY_STORAGE, PREF_KEY])
      const key = (result[GEMINI_KEY_STORAGE] as string | undefined) ?? ''
      setSavedKey(key)
      setApiKey(key)
      setPreference((result[PREF_KEY] as ProviderPreference | undefined) ?? 'auto')
    })()

    // Check Chrome Prompt API availability
    void (async () => {
      const status = await window.LanguageModel?.availability().catch(() => 'unavailable')
      setPromptApiAvailable(status === 'available' || status === 'downloadable')
      setPromptApiDownload(status === 'downloadable')
    })()
  }, [])

  const keyValid = apiKey.startsWith('AIza') && apiKey.length > 30
  const hasGeminiKey = savedKey.startsWith('AIza') && savedKey.length > 30

  async function saveKey() {
    setKeyPhase('saving')
    await chrome.storage.local.set({ [GEMINI_KEY_STORAGE]: apiKey.trim() })
    setSavedKey(apiKey.trim())
    setKeyPhase('idle')
    setKeyMessage('Key saved.')
    setTimeout(() => setKeyMessage(''), 2000)
  }

  async function testKey() {
    setKeyPhase('testing')
    setKeyMessage('')
    try {
      const stream = geminiProvider.generateStream({
        systemPrompt: 'Reply with exactly one word.',
        userPrompt: 'Say "ok"',
        maxOutputTokens: 5,
        temperature: 0,
      })
      for await (const _chunk of stream) {
        break
      }
      setKeyPhase('ok')
      setKeyMessage('Key works!')
    } catch (e) {
      setKeyPhase('error')
      setKeyMessage(isFriendlyError(e) ? e.friendlyMessage : e instanceof Error ? e.message : 'Test failed')
    }
    setTimeout(() => {
      setKeyPhase('idle')
      setKeyMessage('')
    }, 3000)
  }

  async function savePref(pref: ProviderPreference) {
    setPreference(pref)
    await chrome.storage.local.set({ [PREF_KEY]: pref })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">
        AI Features
      </h3>

      {/* Provider status */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2.5 text-xs space-y-1">
        {promptApiAvailable ? (
          <>
            <p className="text-emerald-400">
              ✓ On-device AI (Gemini Nano) available. Fully private, no key needed.
            </p>
            {promptApiDownload && (
              <p className="text-amber-500/80">
                Note: first use will download the model (~2 GB). Subsequent runs are instant.
              </p>
            )}
          </>
        ) : hasGeminiKey ? (
          <p className="text-emerald-400">✓ Using Gemini API. Free tier — 15 requests/min.</p>
        ) : (
          <p className="text-amber-500">
            No AI provider configured.{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-amber-400"
            >
              Get a free Gemini API key
            </a>{' '}
            to enable AI features.
          </p>
        )}
      </div>

      {/* API key input */}
      <div className="space-y-2">
        <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-gray-600">
          Gemini API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza…"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 pr-8 text-xs text-gray-200 placeholder-gray-600 focus:border-sky-700/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
            aria-label={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void saveKey()}
            disabled={!keyValid || apiKey.trim() === savedKey || keyPhase === 'saving'}
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-200 disabled:opacity-40"
          >
            {keyPhase === 'saving' ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => void testKey()}
            disabled={!hasGeminiKey || keyPhase === 'testing'}
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-200 disabled:opacity-40"
          >
            {keyPhase === 'testing' ? 'Testing…' : 'Test'}
          </button>
        </div>

        {keyMessage && (
          <p
            className={`text-xs ${
              keyPhase === 'error' || keyPhase === 'idle' && keyMessage.includes('failed')
                ? 'text-red-400'
                : keyPhase === 'ok'
                  ? 'text-emerald-400'
                  : 'text-gray-400'
            }`}
          >
            {keyMessage}
          </p>
        )}
      </div>

      {/* Provider preference */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-gray-600">
          Provider preference
        </label>
        <select
          value={preference}
          onChange={(e) => void savePref(e.target.value as ProviderPreference)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-300 focus:border-sky-700/60 focus:outline-none"
        >
          <option value="auto">Auto (prefer on-device)</option>
          <option value="prompt-api">Prefer on-device AI (Gemini Nano)</option>
          <option value="gemini-api">Prefer Gemini API</option>
        </select>
      </div>

      {/* Privacy note */}
      <p className="text-[10px] leading-relaxed text-gray-600">
        Your API key is stored only in this browser. We never send your CV, JDs, or generated
        content to any server other than the AI provider you've selected.
      </p>

      {/* Dev tools toggle */}
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={showDevTools}
          onChange={(e) => setShowDevTools(e.target.checked)}
          className="h-3 w-3 accent-amber-500"
        />
        <span className="text-[10px] text-gray-600">Show developer tools</span>
      </label>

      {showDevTools && <AITestHarness />}
    </div>
  )
}
