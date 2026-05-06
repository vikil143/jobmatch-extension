import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest((env) => ({
  manifest_version: 3,
  name: 'JobMatch',
  version: '0.1.0',
  description: 'AI-powered job matching for LinkedIn and Naukri',
  permissions: ['sidePanel', 'storage', 'tabs'],
  host_permissions: [
    'https://www.linkedin.com/*',
    'https://www.naukri.com/*',
    'https://job-boards.greenhouse.io/*',
  ],
  action: {
    default_title: 'Open JobMatch',
    default_icon: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: [
        'https://www.linkedin.com/*',
        'https://www.naukri.com/*',
      ],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
    {
      matches: ['https://job-boards.greenhouse.io/*'],
      js: ['src/content/greenhouse.ts'],
      run_at: 'document_idle',
    },
  ],
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  // MV3 default CSP doesn't declare worker-src, which blocks pdfjs-dist's
  // module worker ({type:"module"}). Explicitly allow self + blob:.
  // In dev mode also allow localhost so @crxjs HMR works.
  content_security_policy: {
    extension_pages: env.mode === 'development'
      ? "script-src 'self' http://localhost:5173; worker-src 'self' http://localhost:5173; object-src 'self'"
      : "script-src 'self'; worker-src 'self'; object-src 'self'",
  },
}))
