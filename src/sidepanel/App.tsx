import { useState, useEffect, useMemo } from 'react'
import CVUpload from './components/CVUpload'
import JDPreview from './components/JDPreview'
import MatchScore from './components/MatchScore'
import SkillGap from './components/SkillGap'
import { computeMatch } from '../lib/matching/match'
import { cvStorage } from '../lib/storage'
import type { JobPosting } from '../types/jobs'
import type { ExtensionMessage } from '../types/messages'

export default function App() {
  const [jd, setJd] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cvText, setCvText] = useState<string | null>(null)

  useEffect(() => {
    const req: ExtensionMessage = { type: 'GET_CURRENT_JD' }
    chrome.runtime.sendMessage(req, (response: unknown) => {
      if (chrome.runtime.lastError) { setIsLoading(false); return }
      const msg = response as ExtensionMessage | undefined
      if (msg?.type === 'CURRENT_JD') setJd(msg.payload)
      setIsLoading(false)
    })

    function onMessage(message: ExtensionMessage): void {
      if (message.type === 'JD_EXTRACTED') {
        setJd(message.payload)
        setIsLoading(false)
      }
    }
    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [])

  // Load CV text from storage and keep in sync when user uploads/replaces.
  useEffect(() => {
    void cvStorage.get().then((r) => setCvText(r?.text ?? null))

    function onStorageChange(
      changes: Record<string, chrome.storage.StorageChange>
    ) {
      if ('cv:default' in changes) {
        const next = changes['cv:default']?.newValue as { text?: string } | undefined
        setCvText(next?.text ?? null)
      }
    }
    chrome.storage.local.onChanged.addListener(onStorageChange)
    return () => chrome.storage.local.onChanged.removeListener(onStorageChange)
  }, [])

  const match = useMemo(() => {
    if (!cvText || !jd) return null
    return computeMatch(cvText, jd.description)
  }, [cvText, jd])

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-gray-100">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white">JobMatch</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <JDPreview jd={jd} isLoading={isLoading} />
        {match && (
          <>
            <div className="border-b border-gray-800">
              <MatchScore score={match.score} />
            </div>
            <SkillGap matched={match.matchedSkills} missing={match.missingSkills} />
          </>
        )}
        <CVUpload />
      </main>
    </div>
  )
}
