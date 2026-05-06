import { useState, useCallback, useRef } from 'react'
import { getActiveProvider } from './index'
import type { GenerateOptions } from './types'
import { NoProviderError } from './types'

interface AIGenerationState {
  output: string
  isStreaming: boolean
  error: Error | null
  providerUsed: string | null
}

const INITIAL_STATE: AIGenerationState = {
  output: '',
  isStreaming: false,
  error: null,
  providerUsed: null,
}

export function useAIGeneration() {
  const [state, setState] = useState<AIGenerationState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)

  const generate = useCallback(
    async (opts: Omit<GenerateOptions, 'signal'>) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({ output: '', isStreaming: true, error: null, providerUsed: null })

      try {
        const provider = await getActiveProvider()
        if (!provider) throw new NoProviderError()

        setState((s) => ({ ...s, providerUsed: provider.name }))

        const stream = provider.generateStream({ ...opts, signal: controller.signal })
        for await (const chunk of stream) {
          if (controller.signal.aborted) break
          setState((s) => ({ ...s, output: s.output + chunk }))
        }
      } catch (err) {
        if (controller.signal.aborted) return
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err : new Error(String(err)),
        }))
      } finally {
        setState((s) => ({ ...s, isStreaming: false }))
      }
    },
    [],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    generate,
    output: state.output,
    isStreaming: state.isStreaming,
    error: state.error,
    providerUsed: state.providerUsed,
    cancel,
  }
}
