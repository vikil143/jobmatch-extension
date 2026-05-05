import { getExtractor } from './extractors'
import type { ExtensionMessage } from '../types/messages'

const extractor = getExtractor(window.location.hostname)

// No extractor means this content script somehow ran on an unmatched host.
if (!extractor) {
  throw new Error(`JobMatch: no extractor for ${window.location.hostname}`)
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function runExtraction(): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    const posting = extractor!()
    if (!posting) return
    const msg: ExtensionMessage = { type: 'JD_EXTRACTED', payload: posting }
    // sendMessage may throw if no listener is ready yet; suppress that.
    chrome.runtime.sendMessage(msg).catch(() => undefined)
  }, 500)
}

// ── SPA navigation (LinkedIn uses history.pushState heavily) ──────────────────
const origPushState = history.pushState.bind(history)
history.pushState = function (...args: Parameters<typeof history.pushState>) {
  origPushState(...args)
  runExtraction()
}
window.addEventListener('popstate', runExtraction)

// ── DOM mutation observer (lazy-loaded content, Naukri single-page renders) ──
// childList + subtree catches new job content being injected into the shell.
// Debounce ensures we wait for the DOM to settle before extracting.
const observer = new MutationObserver(runExtraction)
observer.observe(document.body, { childList: true, subtree: true })

// ── Initial extraction on script load ────────────────────────────────────────
runExtraction()
