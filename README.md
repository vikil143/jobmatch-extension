# jobmatch-extension

## Maintenance notes

### Updating pdfjs-dist

The PDF.js worker is served as a static extension resource (`public/pdf.worker.min.mjs`). It is **not** auto-updated by `pnpm update`. After bumping `pdfjs-dist` in `package.json`, re-copy the worker manually:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

Then rebuild: `pnpm build`.
