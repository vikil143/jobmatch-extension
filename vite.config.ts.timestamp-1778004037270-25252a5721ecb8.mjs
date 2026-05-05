// vite.config.ts
import { defineConfig } from "file:///vikil/Extensions/jobmatch-extension/node_modules/.pnpm/vite@5.4.21/node_modules/vite/dist/node/index.js";
import react from "file:///vikil/Extensions/jobmatch-extension/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///vikil/Extensions/jobmatch-extension/node_modules/.pnpm/@crxjs+vite-plugin@2.4.0_vite@5.4.21/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.config.ts
import { defineManifest } from "file:///vikil/Extensions/jobmatch-extension/node_modules/.pnpm/@crxjs+vite-plugin@2.4.0_vite@5.4.21/node_modules/@crxjs/vite-plugin/dist/index.mjs";
var manifest_config_default = defineManifest((env) => ({
  manifest_version: 3,
  name: "JobMatch",
  version: "0.1.0",
  description: "AI-powered job matching for LinkedIn and Naukri",
  permissions: ["sidePanel", "storage", "tabs"],
  host_permissions: [
    "https://www.linkedin.com/*",
    "https://www.naukri.com/*"
  ],
  action: {
    default_title: "Open JobMatch",
    default_icon: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  side_panel: {
    default_path: "src/sidepanel/index.html"
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: [
        "https://www.linkedin.com/*",
        "https://www.naukri.com/*"
      ],
      js: ["src/content/index.ts"],
      run_at: "document_idle"
    }
  ],
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  // MV3 default CSP doesn't declare worker-src, which blocks pdfjs-dist's
  // module worker ({type:"module"}). Explicitly allow self + blob:.
  // In dev mode also allow localhost so @crxjs HMR works.
  content_security_policy: {
    extension_pages: env.mode === "development" ? "script-src 'self' http://localhost:5173; worker-src 'self' http://localhost:5173; object-src 'self'" : "script-src 'self'; worker-src 'self'; object-src 'self'"
  }
}));

// vite.config.ts
import fs from "fs";
import path from "path";
var __vite_injected_original_dirname = "/vikil/Extensions/jobmatch-extension";
function fixServiceWorkerLoader() {
  let backgroundChunkFile = null;
  return {
    name: "fix-service-worker-loader",
    apply: "build",
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === "chunk" && chunk.facadeModuleId?.includes("background/index")) {
          backgroundChunkFile = fileName;
        }
      }
    },
    closeBundle() {
      if (!backgroundChunkFile) return;
      const loaderPath = path.resolve(__vite_injected_original_dirname, "dist/service-worker-loader.js");
      fs.writeFileSync(loaderPath, `import './${backgroundChunkFile}';
`);
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest_config_default }),
    fixServiceWorkerLoader()
  ],
  optimizeDeps: {
    exclude: ["pdfjs-dist"]
  },
  server: {
    cors: true,
    // Chrome blocks SW requests to localhost without this header.
    headers: { "Access-Control-Allow-Origin": "*" },
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3Zpa2lsL0V4dGVuc2lvbnMvam9ibWF0Y2gtZXh0ZW5zaW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvdmlraWwvRXh0ZW5zaW9ucy9qb2JtYXRjaC1leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Zpa2lsL0V4dGVuc2lvbnMvam9ibWF0Y2gtZXh0ZW5zaW9uL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW4gfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgY3J4IH0gZnJvbSAnQGNyeGpzL3ZpdGUtcGx1Z2luJ1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vbWFuaWZlc3QuY29uZmlnJ1xuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuLy8gQGNyeGpzL3ZpdGUtcGx1Z2luIHYyIGJ1Zzogc2VydmljZS13b3JrZXItbG9hZGVyLmpzIHN0aWxsIGltcG9ydHMgZnJvbVxuLy8gbG9jYWxob3N0OjUxNzMgaW4gcHJvZHVjdGlvbiBidWlsZHMuIFRoaXMgcGx1Z2luIGRldGVjdHMgdGhlIHJlYWwgYmFja2dyb3VuZFxuLy8gYnVuZGxlIHBhdGggYW5kIHJld3JpdGVzIHRoZSBsb2FkZXIgYWZ0ZXIgdGhlIGJ1aWxkIGNvbXBsZXRlcy5cbmZ1bmN0aW9uIGZpeFNlcnZpY2VXb3JrZXJMb2FkZXIoKTogUGx1Z2luIHtcbiAgbGV0IGJhY2tncm91bmRDaHVua0ZpbGU6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnZml4LXNlcnZpY2Utd29ya2VyLWxvYWRlcicsXG4gICAgYXBwbHk6ICdidWlsZCcsXG4gICAgZ2VuZXJhdGVCdW5kbGUoXywgYnVuZGxlKSB7XG4gICAgICBmb3IgKGNvbnN0IFtmaWxlTmFtZSwgY2h1bmtdIG9mIE9iamVjdC5lbnRyaWVzKGJ1bmRsZSkpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGNodW5rLnR5cGUgPT09ICdjaHVuaycgJiZcbiAgICAgICAgICBjaHVuay5mYWNhZGVNb2R1bGVJZD8uaW5jbHVkZXMoJ2JhY2tncm91bmQvaW5kZXgnKVxuICAgICAgICApIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kQ2h1bmtGaWxlID0gZmlsZU5hbWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2VCdW5kbGUoKSB7XG4gICAgICBpZiAoIWJhY2tncm91bmRDaHVua0ZpbGUpIHJldHVyblxuICAgICAgY29uc3QgbG9hZGVyUGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0L3NlcnZpY2Utd29ya2VyLWxvYWRlci5qcycpXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKGxvYWRlclBhdGgsIGBpbXBvcnQgJy4vJHtiYWNrZ3JvdW5kQ2h1bmtGaWxlfSc7XFxuYClcbiAgICB9LFxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIGNyeCh7IG1hbmlmZXN0IH0pLFxuICAgIGZpeFNlcnZpY2VXb3JrZXJMb2FkZXIoKSxcbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydwZGZqcy1kaXN0J10sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGNvcnM6IHRydWUsXG4gICAgLy8gQ2hyb21lIGJsb2NrcyBTVyByZXF1ZXN0cyB0byBsb2NhbGhvc3Qgd2l0aG91dCB0aGlzIGhlYWRlci5cbiAgICBoZWFkZXJzOiB7ICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicgfSxcbiAgICBwb3J0OiA1MTczLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgaG1yOiB7IHBvcnQ6IDUxNzMgfSxcbiAgfSxcbn0pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi92aWtpbC9FeHRlbnNpb25zL2pvYm1hdGNoLWV4dGVuc2lvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Zpa2lsL0V4dGVuc2lvbnMvam9ibWF0Y2gtZXh0ZW5zaW9uL21hbmlmZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vdmlraWwvRXh0ZW5zaW9ucy9qb2JtYXRjaC1leHRlbnNpb24vbWFuaWZlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lTWFuaWZlc3QgfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZU1hbmlmZXN0KChlbnYpID0+ICh7XG4gIG1hbmlmZXN0X3ZlcnNpb246IDMsXG4gIG5hbWU6ICdKb2JNYXRjaCcsXG4gIHZlcnNpb246ICcwLjEuMCcsXG4gIGRlc2NyaXB0aW9uOiAnQUktcG93ZXJlZCBqb2IgbWF0Y2hpbmcgZm9yIExpbmtlZEluIGFuZCBOYXVrcmknLFxuICBwZXJtaXNzaW9uczogWydzaWRlUGFuZWwnLCAnc3RvcmFnZScsICd0YWJzJ10sXG4gIGhvc3RfcGVybWlzc2lvbnM6IFtcbiAgICAnaHR0cHM6Ly93d3cubGlua2VkaW4uY29tLyonLFxuICAgICdodHRwczovL3d3dy5uYXVrcmkuY29tLyonLFxuICBdLFxuICBhY3Rpb246IHtcbiAgICBkZWZhdWx0X3RpdGxlOiAnT3BlbiBKb2JNYXRjaCcsXG4gICAgZGVmYXVsdF9pY29uOiB7XG4gICAgICAnMTYnOiAnaWNvbnMvaWNvbjE2LnBuZycsXG4gICAgICAnNDgnOiAnaWNvbnMvaWNvbjQ4LnBuZycsXG4gICAgICAnMTI4JzogJ2ljb25zL2ljb24xMjgucG5nJyxcbiAgICB9LFxuICB9LFxuICBzaWRlX3BhbmVsOiB7XG4gICAgZGVmYXVsdF9wYXRoOiAnc3JjL3NpZGVwYW5lbC9pbmRleC5odG1sJyxcbiAgfSxcbiAgYmFja2dyb3VuZDoge1xuICAgIHNlcnZpY2Vfd29ya2VyOiAnc3JjL2JhY2tncm91bmQvaW5kZXgudHMnLFxuICAgIHR5cGU6ICdtb2R1bGUnLFxuICB9LFxuICBjb250ZW50X3NjcmlwdHM6IFtcbiAgICB7XG4gICAgICBtYXRjaGVzOiBbXG4gICAgICAgICdodHRwczovL3d3dy5saW5rZWRpbi5jb20vKicsXG4gICAgICAgICdodHRwczovL3d3dy5uYXVrcmkuY29tLyonLFxuICAgICAgXSxcbiAgICAgIGpzOiBbJ3NyYy9jb250ZW50L2luZGV4LnRzJ10sXG4gICAgICBydW5fYXQ6ICdkb2N1bWVudF9pZGxlJyxcbiAgICB9LFxuICBdLFxuICBpY29uczoge1xuICAgICcxNic6ICdpY29ucy9pY29uMTYucG5nJyxcbiAgICAnNDgnOiAnaWNvbnMvaWNvbjQ4LnBuZycsXG4gICAgJzEyOCc6ICdpY29ucy9pY29uMTI4LnBuZycsXG4gIH0sXG4gIC8vIE1WMyBkZWZhdWx0IENTUCBkb2Vzbid0IGRlY2xhcmUgd29ya2VyLXNyYywgd2hpY2ggYmxvY2tzIHBkZmpzLWRpc3Qnc1xuICAvLyBtb2R1bGUgd29ya2VyICh7dHlwZTpcIm1vZHVsZVwifSkuIEV4cGxpY2l0bHkgYWxsb3cgc2VsZiArIGJsb2I6LlxuICAvLyBJbiBkZXYgbW9kZSBhbHNvIGFsbG93IGxvY2FsaG9zdCBzbyBAY3J4anMgSE1SIHdvcmtzLlxuICBjb250ZW50X3NlY3VyaXR5X3BvbGljeToge1xuICAgIGV4dGVuc2lvbl9wYWdlczogZW52Lm1vZGUgPT09ICdkZXZlbG9wbWVudCdcbiAgICAgID8gXCJzY3JpcHQtc3JjICdzZWxmJyBodHRwOi8vbG9jYWxob3N0OjUxNzM7IHdvcmtlci1zcmMgJ3NlbGYnIGh0dHA6Ly9sb2NhbGhvc3Q6NTE3Mzsgb2JqZWN0LXNyYyAnc2VsZidcIlxuICAgICAgOiBcInNjcmlwdC1zcmMgJ3NlbGYnOyB3b3JrZXItc3JjICdzZWxmJzsgb2JqZWN0LXNyYyAnc2VsZidcIixcbiAgfSxcbn0pKVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4UixTQUFTLG9CQUE0QjtBQUNuVSxPQUFPLFdBQVc7QUFDbEIsU0FBUyxXQUFXOzs7QUNGa1IsU0FBUyxzQkFBc0I7QUFFclUsSUFBTywwQkFBUSxlQUFlLENBQUMsU0FBUztBQUFBLEVBQ3RDLGtCQUFrQjtBQUFBLEVBQ2xCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxFQUNULGFBQWE7QUFBQSxFQUNiLGFBQWEsQ0FBQyxhQUFhLFdBQVcsTUFBTTtBQUFBLEVBQzVDLGtCQUFrQjtBQUFBLElBQ2hCO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLGVBQWU7QUFBQSxJQUNmLGNBQWM7QUFBQSxNQUNaLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUFBLEVBQ0EsWUFBWTtBQUFBLElBQ1YsY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQSxZQUFZO0FBQUEsSUFDVixnQkFBZ0I7QUFBQSxJQUNoQixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsaUJBQWlCO0FBQUEsSUFDZjtBQUFBLE1BQ0UsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsSUFBSSxDQUFDLHNCQUFzQjtBQUFBLE1BQzNCLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUlBLHlCQUF5QjtBQUFBLElBQ3ZCLGlCQUFpQixJQUFJLFNBQVMsZ0JBQzFCLHdHQUNBO0FBQUEsRUFDTjtBQUNGLEVBQUU7OztBRDlDRixPQUFPLFFBQVE7QUFDZixPQUFPLFVBQVU7QUFMakIsSUFBTSxtQ0FBbUM7QUFVekMsU0FBUyx5QkFBaUM7QUFDeEMsTUFBSSxzQkFBcUM7QUFFekMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLElBQ1AsZUFBZSxHQUFHLFFBQVE7QUFDeEIsaUJBQVcsQ0FBQyxVQUFVLEtBQUssS0FBSyxPQUFPLFFBQVEsTUFBTSxHQUFHO0FBQ3RELFlBQ0UsTUFBTSxTQUFTLFdBQ2YsTUFBTSxnQkFBZ0IsU0FBUyxrQkFBa0IsR0FDakQ7QUFDQSxnQ0FBc0I7QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxjQUFjO0FBQ1osVUFBSSxDQUFDLG9CQUFxQjtBQUMxQixZQUFNLGFBQWEsS0FBSyxRQUFRLGtDQUFXLCtCQUErQjtBQUMxRSxTQUFHLGNBQWMsWUFBWSxhQUFhLG1CQUFtQjtBQUFBLENBQU07QUFBQSxJQUNyRTtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLElBQUksRUFBRSxrQ0FBUyxDQUFDO0FBQUEsSUFDaEIsdUJBQXVCO0FBQUEsRUFDekI7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxZQUFZO0FBQUEsRUFDeEI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBRU4sU0FBUyxFQUFFLCtCQUErQixJQUFJO0FBQUEsSUFDOUMsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osS0FBSyxFQUFFLE1BQU0sS0FBSztBQUFBLEVBQ3BCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
