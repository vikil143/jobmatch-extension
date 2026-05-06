import { useState, useEffect, useRef, useCallback } from 'react'
import { applicationStorage, cvStorage } from '../../lib/storage'
import { getActiveProvider } from '../../lib/ai'
import { NoProviderError, isFriendlyError } from '../../lib/ai/types'
import { buildTailorPrompt } from '../../lib/ai/prompts/tailorResume'
import {
  parseTailoredResumeResponse,
  addValidationFlags,
  toStoredResume,
  type ValidatedTailoredResume,
} from '../../lib/ai/validation/tailorResume'
import type { ApplicationRecord } from '../../types/jobs'

export type { ValidatedTailoredResume }

export interface UseTailoredResumeReturn {
  tailored: ValidatedTailoredResume | null
  isGenerating: boolean
  error: string | null
  rawStream: string
  tokenCount: number
  providerName: string | null
  generate: () => Promise<void>
  cancel: () => void
  save: (edits: Record<string, string>) => Promise<void>
}

export function useTailoredResume(applicationId: string): UseTailoredResumeReturn {
  const [tailored, setTailored] = useState<ValidatedTailoredResume | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawStream, setRawStream] = useState('')
  const [tokenCount, setTokenCount] = useState(0)
  const [providerName, setProviderName] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load persisted tailored resume on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      const [records, cvRecord] = await Promise.all([
        applicationStorage.get(),
        cvStorage.get(),
      ])
      if (cancelled) return
      const app = records.find((r) => r.id === applicationId)
      if (app?.tailoredResume && cvRecord?.text) {
        setTailored(addValidationFlags(app.tailoredResume, cvRecord.text))
        setProviderName(app.tailoredResume.provider)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [applicationId])

  const generate = useCallback(async () => {
    const [records, cvRecord] = await Promise.all([
      applicationStorage.get(),
      cvStorage.get(),
    ])
    const app = records.find((r: ApplicationRecord) => r.id === applicationId)

    if (!cvRecord?.text) {
      setError('No CV uploaded. Upload your resume in the Match tab first.')
      return
    }
    if (!app?.jobDescription) {
      setError('No job description stored for this application. Re-save it from the Match tab with the JD open.')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsGenerating(true)
    setError(null)
    setRawStream('')
    setTokenCount(0)

    let accumulated = ''
    try {
      const provider = await getActiveProvider()
      if (!provider) throw new NoProviderError()
      setProviderName(provider.name)

      const { systemPrompt, userPrompt } = buildTailorPrompt(cvRecord.text, app.jobDescription)
      const stream = provider.generateStream({
        systemPrompt,
        userPrompt,
        maxOutputTokens: 2048,
        signal: controller.signal,
      })

      for await (const chunk of stream) {
        if (controller.signal.aborted) break
        accumulated += chunk
        setRawStream(accumulated)
        setTokenCount(Math.ceil(accumulated.length / 4))
      }

      if (controller.signal.aborted) return

      const finalTokenCount = Math.ceil(accumulated.length / 4)
      console.log(`[TailorResume] provider=${provider.name} output_chars=${accumulated.length} estimated_tokens=${finalTokenCount}`)

      const parsed = parseTailoredResumeResponse(accumulated, cvRecord.text)
      const result: ValidatedTailoredResume = {
        ...parsed,
        generatedAt: Date.now(),
        provider: provider.name,
        userEdits: {},
      }
      setTailored(result)
      setRawStream('')
      // Auto-save to storage
      await applicationStorage.update(applicationId, {
        tailoredResume: toStoredResume(result),
      })
    } catch (err) {
      if (controller.signal.aborted) return
      const msg = isFriendlyError(err)
        ? err.friendlyMessage
        : err instanceof Error
          ? err.message
          : 'Unknown error. Please retry.'
      setError(msg)
    } finally {
      if (!controller.signal.aborted) {
        setIsGenerating(false)
      }
    }
  }, [applicationId])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setIsGenerating(false)
    setRawStream('')
    setTokenCount(0)
  }, [])

  const save = useCallback(
    async (edits: Record<string, string>) => {
      if (!tailored) return
      const updated: ValidatedTailoredResume = { ...tailored, userEdits: edits }
      setTailored(updated)
      await applicationStorage.update(applicationId, {
        tailoredResume: toStoredResume(updated),
      })
    },
    [applicationId, tailored],
  )

  return { tailored, isGenerating, error, rawStream, tokenCount, providerName, generate, cancel, save }
}
