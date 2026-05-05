import type { JobPosting } from '../types/jobs'
import type { ExtensionMessage } from '../types/messages'

// Per-tab JD cache. The SW can be terminated and lose this state; the content
// script's MutationObserver will re-send on the next DOM change.
const jdMap = new Map<number, JobPosting>()

chrome.action.onClicked.addListener((tab) => {
  if (tab.id == null) return
  chrome.sidePanel.open({ tabId: tab.id })
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ enabled: true })
})

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === 'JD_EXTRACTED') {
      const tabId = sender.tab?.id
      if (tabId != null) jdMap.set(tabId, message.payload)
      // Content scripts' sendMessage already reaches all open extension pages
      // (side panel included), so no relay is needed here.
      sendResponse({ ok: true })
      return false
    }

    if (message.type === 'GET_CURRENT_JD') {
      // Side panel requests the latest JD for the active tab on open.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id
        const payload: JobPosting | null =
          tabId != null ? (jdMap.get(tabId) ?? null) : null
        const response: ExtensionMessage = { type: 'CURRENT_JD', payload }
        sendResponse(response)
      })
      return true // keep channel open for async sendResponse
    }

    return false
  },
)
