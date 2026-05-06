import { useState, useEffect, useMemo } from 'react'
import CVUpload from './components/CVUpload'
import JDPreview from './components/JDPreview'
import MatchScore from './components/MatchScore'
import SkillGap from './components/SkillGap'
import History from './components/History'
import SettingsDrawer from './components/SettingsDrawer'
import Welcome from './components/Welcome'
import CoverLetterDrawer from './components/CoverLetterDrawer'
import { computeMatch } from '../lib/matching/match'
import { cvStorage, historyStorage } from '../lib/storage'
import type { JobPosting } from '../types/jobs'
import type { ExtensionMessage } from '../types/messages'

const WELCOME_KEY = 'ui:welcomed'

type Tab = 'match' | 'history'

function GearIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

export default function App() {
  const [welcomed, setWelcomed] = useState<boolean | null>(null)
  const [jd, setJd] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cvText, setCvText] = useState<string | null>(null)
  const [manualJdText, setManualJdText] = useState('')
  const [tab, setTab] = useState<Tab>('match')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [coverLetterOpen, setCoverLetterOpen] = useState(false)

  // Check first-run state
  useEffect(() => {
    chrome.storage.local.get(WELCOME_KEY).then((result) => {
      setWelcomed(!!(result[WELCOME_KEY] as boolean | undefined))
    }).catch(() => setWelcomed(true))
  }, [])

  function dismissWelcome() {
    void chrome.storage.local.set({ [WELCOME_KEY]: true })
    setWelcomed(true)
  }

  // JD extraction via background service worker
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
        setManualJdText('')
        setIsLoading(false)
      }
    }
    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [])

  // CV sync with storage
  useEffect(() => {
    void cvStorage.get().then((r) => setCvText(r?.text ?? null))

    function onStorageChange(changes: Record<string, chrome.storage.StorageChange>) {
      if ('cv:default' in changes) {
        const next = changes['cv:default']?.newValue as { text?: string } | undefined
        setCvText(next?.text ?? null)
      }
    }
    chrome.storage.local.onChanged.addListener(onStorageChange)
    return () => chrome.storage.local.onChanged.removeListener(onStorageChange)
  }, [])

  // The effective JD description: extracted JD takes priority, then manual paste
  const jdDescription = jd?.description ?? (manualJdText.trim().length > 50 ? manualJdText.trim() : null)

  const match = useMemo(() => {
    if (!cvText || !jdDescription) return null
    return computeMatch(cvText, jdDescription)
  }, [cvText, jdDescription])

  // Persist match to history when a real extracted JD is matched
  useEffect(() => {
    if (!jd || !match) return
    void historyStorage.push({
      id: `${jd.url}-${jd.extractedAt}`,
      job: jd,
      match,
      savedAt: Date.now(),
    })
  }, [jd, match])

  // Spinner while loading welcome flag (avoids flash of welcome screen for returning users)
  if (welcomed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-sky-500" />
      </div>
    )
  }

  if (!welcomed) {
    return <Welcome onDismiss={dismissWelcome} />
  }

  const showResumeHint = !isLoading && !cvText && !match

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white">JobMatch</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-300"
          aria-label="Open settings"
        >
          <GearIcon />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['match', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
              tab === t
                ? 'border-b-2 border-sky-500 text-sky-400'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'match' ? (
          <>
            <JDPreview
              jd={jd}
              isLoading={isLoading}
              onManualJd={setManualJdText}
            />

            {match && (
              <>
                <div className="border-b border-gray-800">
                  <MatchScore
                    score={match.score}
                    skillCoverage={match.skillCoverage}
                    keywordOverlap={match.keywordOverlap}
                  />
                </div>
                <SkillGap matched={match.matchedSkills} missing={match.missingSkills} />
                {match.score > 0 && (
                  <div className="border-t border-gray-800/60 px-4 py-3">
                    <button
                      onClick={() => setCoverLetterOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-800/60 bg-sky-950/40 px-4 py-2.5 text-sm font-semibold text-sky-300 transition-colors hover:border-sky-700 hover:bg-sky-900/40"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Draft cover letter
                    </button>
                  </div>
                )}
              </>
            )}

            {showResumeHint && (
              <div className="px-4 py-3">
                <p className="text-xs text-gray-600">
                  Upload your resume below to see your match score.
                </p>
              </div>
            )}

            <div className={match ? 'border-t border-gray-800/60' : ''}>
              <CVUpload />
            </div>
          </>
        ) : (
          <History />
        )}
      </main>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CoverLetterDrawer
        open={coverLetterOpen}
        onClose={() => setCoverLetterOpen(false)}
        cvText={cvText ?? ''}
        jdText={jdDescription ?? ''}
        jobTitle={jd?.title ?? ''}
        company={jd?.company ?? ''}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    </div>
  )
}
