import { useState, useEffect, useRef, useCallback } from 'react'
import { applicationStorage, cvStorage, profileStorage } from '../../lib/storage'
import { getActiveProvider } from '../../lib/ai'
import { NoProviderError, isFriendlyError } from '../../lib/ai/types'
import { buildCoverLetterPrompt } from '../../lib/ai/prompts/coverLetter'
import type { RefinementType } from '../../lib/ai/prompts/coverLetter'
import type { ApplicationRecord, CoverLetter, CoverLetterTone, CoverLetterLength } from '../../types/jobs'

export type { RefinementType }

export interface UseCoverLetterReturn {
  coverLetter: CoverLetter | null
  isGenerating: boolean
  error: string | null
  streamContent: string
  tokenCount: number
  providerName: string | null
  tone: CoverLetterTone
  length: CoverLetterLength
  setTone: (tone: CoverLetterTone) => void
  setLength: (length: CoverLetterLength) => void
  generate: (opts?: { refinement?: RefinementType }) => Promise<void>
  cancel: () => void
  saveEdits: (text: string) => void
  resetToAI: () => Promise<void>
}

function postProcess(text: string): string {
  return text
    .trim()
    .replace(/^```[\w]*\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
}

export function useCoverLetter(applicationId: string): UseCoverLetterReturn {
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamContent, setStreamContent] = useState('')
  const [tokenCount, setTokenCount] = useState(0)
  const [providerName, setProviderName] = useState<string | null>(null)
  const [tone, setTone] = useState<CoverLetterTone>('professional')
  const [length, setLength] = useState<CoverLetterLength>('medium')

  const abortRef = useRef<AbortController | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refs so generate/saveEdits can read latest values without being in their dep arrays
  const coverLetterRef = useRef<CoverLetter | null>(null)
  const toneRef = useRef<CoverLetterTone>('professional')
  const lengthRef = useRef<CoverLetterLength>('medium')

  useEffect(() => { coverLetterRef.current = coverLetter }, [coverLetter])
  useEffect(() => { toneRef.current = tone }, [tone])
  useEffect(() => { lengthRef.current = length }, [length])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Load persisted cover letter on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      const records = await applicationStorage.get()
      if (cancelled) return
      const app = records.find((r) => r.id === applicationId)
      if (app?.coverLetter) {
        setCoverLetter(app.coverLetter)
        setTone(app.coverLetter.tone)
        setLength(app.coverLetter.length)
        setProviderName(app.coverLetter.provider)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [applicationId])

  const generate = useCallback(async (opts?: { refinement?: RefinementType }) => {
    const [records, cvRecord, profile] = await Promise.all([
      applicationStorage.get(),
      cvStorage.get(),
      profileStorage.get(),
    ])
    const app = records.find((r: ApplicationRecord) => r.id === applicationId)

    if (!cvRecord?.text) {
      setError('No CV uploaded. Upload your resume in the Match tab first.')
      return
    }
    if (!app?.jobDescription) {
      setError('No job description stored. Re-save from the Match tab with the JD open.')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsGenerating(true)
    setError(null)
    setStreamContent('')
    setTokenCount(0)

    const currentTone = toneRef.current
    let effectiveLength = lengthRef.current

    if (opts?.refinement === 'shorter') {
      effectiveLength = effectiveLength === 'long' ? 'medium' : 'short'
      setLength(effectiveLength)
    }

    const previousContent = coverLetterRef.current
      ? (coverLetterRef.current.userEdits ?? coverLetterRef.current.content)
      : ''

    const candidateName =
      profile?.preferredName || profile?.fullName || '[Your name]'
    const tailoredSummary = app.tailoredResume?.summary
    const genuineGaps = app.tailoredResume?.genuineGaps

    let accumulated = ''
    try {
      const provider = await getActiveProvider()
      if (!provider) throw new NoProviderError()
      setProviderName(provider.name)

      const { systemPrompt, userPrompt } = buildCoverLetterPrompt({
        cvText: cvRecord.text,
        jdText: app.jobDescription,
        tone: currentTone,
        length: effectiveLength,
        candidateName,
        tailoredSummary,
        genuineGaps,
        refinement: opts?.refinement
          ? { type: opts.refinement, previousContent }
          : undefined,
      })

      const stream = provider.generateStream({
        systemPrompt,
        userPrompt,
        maxOutputTokens: 1500,
        signal: controller.signal,
      })

      for await (const chunk of stream) {
        if (controller.signal.aborted) break
        accumulated += chunk
        setStreamContent(accumulated)
        setTokenCount(Math.ceil(accumulated.length / 4))
      }

      if (controller.signal.aborted) return

      const content = postProcess(accumulated)
      const finalTokens = Math.ceil(accumulated.length / 4)
      console.log(
        `[CoverLetter] provider=${provider.name} refinement=${opts?.refinement ?? 'initial'} chars=${accumulated.length} est_tokens=${finalTokens}`,
      )

      const result: CoverLetter = {
        generatedAt: Date.now(),
        provider: provider.name,
        tone: currentTone,
        length: effectiveLength,
        content,
        userEdits: null,
      }
      setCoverLetter(result)
      coverLetterRef.current = result
      setStreamContent('')
      setTokenCount(finalTokens)
      await applicationStorage.update(applicationId, { coverLetter: result })
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
    setStreamContent('')
    setTokenCount(0)
  }, [])

  const saveEdits = useCallback((text: string) => {
    const cl = coverLetterRef.current
    if (!cl) return
    const updated: CoverLetter = { ...cl, userEdits: text }
    setCoverLetter(updated)
    coverLetterRef.current = updated
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void applicationStorage.update(applicationId, { coverLetter: updated })
    }, 500)
  }, [applicationId])

  const resetToAI = useCallback(async () => {
    const cl = coverLetterRef.current
    if (!cl) return
    const updated: CoverLetter = { ...cl, userEdits: null }
    setCoverLetter(updated)
    coverLetterRef.current = updated
    await applicationStorage.update(applicationId, { coverLetter: updated })
  }, [applicationId])

  return {
    coverLetter,
    isGenerating,
    error,
    streamContent,
    tokenCount,
    providerName,
    tone,
    length,
    setTone,
    setLength,
    generate,
    cancel,
    saveEdits,
    resetToAI,
  }
}
