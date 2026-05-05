import { useState, useEffect } from 'react'
import CVUpload from './components/CVUpload'
import JDPreview from './components/JDPreview'
import type { JobPosting } from '../types/jobs'
import type { ExtensionMessage } from '../types/messages'

export default function App() {
  const [jd, setJd] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // On mount, ask the background for the latest JD for the active tab.
    // This covers the case where the side panel opens after the content script
    // already extracted a posting.
    const req: ExtensionMessage = { type: 'GET_CURRENT_JD' }
    chrome.runtime.sendMessage(req, (response: unknown) => {
      if (chrome.runtime.lastError) {
        setIsLoading(false)
        return
      }
      const msg = response as ExtensionMessage | undefined
      if (msg?.type === 'CURRENT_JD') setJd(msg.payload)
      setIsLoading(false)
    })

    // Content scripts' sendMessage reaches all open extension pages directly,
    // so we listen here without needing the background to relay.
    function onMessage(message: ExtensionMessage): void {
      if (message.type === 'JD_EXTRACTED') {
        setJd(message.payload)
        setIsLoading(false)
      }
    }

    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-gray-100">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white">JobMatch</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <JDPreview jd={jd} isLoading={isLoading} />
        <CVUpload />
      </main>
    </div>
  )
}
