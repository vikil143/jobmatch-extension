# JobMatch Chrome Extension — Project Specification

## Overview

A Chrome MV3 side-panel extension that helps job seekers on LinkedIn and Naukri.com by extracting job listings and profiles, matching them against a user-supplied resume/criteria, and surfacing actionable insights in a persistent side panel.

## Tech Stack

| Layer | Choice |
|---|---|
| Build | Vite 5 + `@crxjs/vite-plugin@beta` (MV3) |
| UI framework | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS v3 (stable) |
| Package manager | pnpm |
| Linting | ESLint (default Vite config) |
| State | React context / `chrome.storage.local` |
| AI | Anthropic Claude API (Phase 3+) |

## Project Structure

```
jobmatch-extension/
├── CLAUDE.md
├── DECISIONS.md
├── manifest.config.ts          # defineManifest() — MV3 manifest
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── index.html                  # Vite dev root (points to sidepanel in dev)
├── package.json
├── src/
│   ├── background/
│   │   └── index.ts            # Service worker — opens side panel on action click
│   ├── sidepanel/
│   │   ├── index.html          # Side panel HTML entry
│   │   ├── main.tsx            # ReactDOM.render root
│   │   └── App.tsx             # Side panel React app
│   ├── content/
│   │   ├── index.ts            # Site dispatcher — detects hostname, loads adapter
│   │   ├── linkedin.ts         # LinkedIn-specific scraper (Phase 2)
│   │   └── naukri.ts           # Naukri-specific scraper (Phase 2)
│   ├── components/             # Shared React components
│   │   ├── JobCard.tsx         # Job listing card (Phase 2)
│   │   ├── MatchScore.tsx      # AI match score display (Phase 3)
│   │   └── ResumeUpload.tsx    # Resume / criteria input (Phase 2)
│   ├── lib/
│   │   ├── storage.ts          # chrome.storage.local helpers
│   │   ├── messaging.ts        # chrome.runtime message helpers
│   │   └── claude.ts           # Anthropic API client (Phase 3)
│   └── types/
│       ├── jobs.ts             # JobListing, MatchResult types
│       └── messages.ts         # Message union types for runtime messaging
└── dist/                       # Built extension (git-ignored)
```

## Manifest Configuration

- **Name**: JobMatch
- **MV**: 3
- **Side panel**: `src/sidepanel/index.html`
- **Action**: triggers `chrome.sidePanel.open()` in background SW
- **Host permissions**: `https://www.linkedin.com/*`, `https://www.naukri.com/*` (NO `<all_urls>`)
- **Background**: service worker at `src/background/index.ts`
- **Content scripts**: `src/content/index.ts` matching the two host patterns above

## Phased Plan

### Phase 1 — Build Pipeline Shell (current)
- Vite + React-TS scaffold
- @crxjs/vite-plugin MV3 integration
- Tailwind v3 configured
- Manifest V3 wired up
- Minimum viable files proving the pipeline works
- Goal: load unpacked in Chrome, side panel renders "JobMatch", content script logs hostname

### Phase 2 — Data Extraction
- LinkedIn job listing scraper (content/linkedin.ts)
- Naukri job listing scraper (content/naukri.ts)
- Job card component in side panel
- Resume / criteria input UI
- chrome.storage.local persistence

### Phase 3 — AI Matching
- Anthropic Claude API integration (claude.ts)
- Send scraped job data + resume to Claude
- Display match scores and reasoning in MatchScore component
- Store results in chrome.storage.local

### Phase 4 — Polish
- Error states, loading skeletons
- Settings page
- Keyboard shortcuts
- Export matched jobs as CSV

## Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview"
}
```

## Key Constraints

- Never use `<all_urls>` — host permissions must be scoped to linkedin.com and naukri.com only
- TypeScript strict mode always on
- Side panel must work without a popup — action click opens the panel, not a popup HTML
- Do not store the Anthropic API key in the extension bundle — prompt the user for it and store in `chrome.storage.local` (Phase 3)
