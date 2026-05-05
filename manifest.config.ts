import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'JobMatch',
  version: '0.1.0',
  description: 'AI-powered job matching for LinkedIn and Naukri',
  permissions: ['sidePanel', 'storage', 'tabs'],
  host_permissions: [
    'https://www.linkedin.com/*',
    'https://www.naukri.com/*',
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
  ],
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
})
