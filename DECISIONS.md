# Architecture Decisions

## Phase 1

| # | Decision | Rationale |
|---|---|---|
| 1 | **pnpm** over npm/yarn | Faster installs, strict node_modules, better monorepo support if needed later |
| 2 | **Vite 5** (pinned, not Vite 6/7/8) | `@crxjs/vite-plugin` 2.x targets Vite 4–5; Vite 8 is the system default but compatibility with CRXJS is untested |
| 3 | **`@crxjs/vite-plugin` (released 2.4.0)** | Requested explicitly. Semver `^2.0.0-beta.33` resolved to the non-beta 2.4.0 release — kept, as it's a superset of the beta |
| 4 | **Tailwind CSS v3 (3.4.x)** | Stable, well-supported; v4 alpha has breaking changes and is not production-ready |
| 5 | **TypeScript 5 strict mode** | `strict: true` + `noUnusedLocals` + `noUnusedParameters` — catches the most bugs at compile time |
| 6 | **`esbuild` approved via `pnpm.onlyBuiltDependencies`** | pnpm 10 blocks build scripts by default; esbuild requires its postinstall to download a native binary |
| 7 | **No root `index.html`** | @crxjs reads entry points from the manifest; a root HTML is unnecessary for extensions |
| 8 | **Placeholder icons as solid-colour PNGs** | Real icon artwork is deferred; placeholders prevent manifest validation errors in Chrome |
| 9 | **`tabs` permission included** | Required by `chrome.sidePanel.open({ tabId })` in the background service worker |
| 10 | **CLAUDE.md authored by Claude** | The file did not exist at project init; Claude reconstructed it from the spec in the user's prompt |
