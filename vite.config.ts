import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'
import fs from 'fs'
import path from 'path'

// @crxjs/vite-plugin v2 bug: service-worker-loader.js still imports from
// localhost:5173 in production builds. This plugin detects the real background
// bundle path and rewrites the loader after the build completes.
function fixServiceWorkerLoader(): Plugin {
  let backgroundChunkFile: string | null = null

  return {
    name: 'fix-service-worker-loader',
    apply: 'build',
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (
          chunk.type === 'chunk' &&
          chunk.facadeModuleId?.includes('background/index')
        ) {
          backgroundChunkFile = fileName
        }
      }
    },
    closeBundle() {
      if (!backgroundChunkFile) return
      const loaderPath = path.resolve(__dirname, 'dist/service-worker-loader.js')
      fs.writeFileSync(loaderPath, `import './${backgroundChunkFile}';\n`)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    fixServiceWorkerLoader(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
})
