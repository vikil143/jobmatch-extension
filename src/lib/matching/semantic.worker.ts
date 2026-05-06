import { pipeline, env } from '@huggingface/transformers'

// Fetch from Hub; never try local FS (not available in an extension worker).
env.allowLocalModels = false

type InMsg = { id: number; type: 'EMBED'; text: string }

type OutMsg =
  | { type: 'READY' }
  | { type: 'INIT_ERR'; error: string }
  | { id: number; type: 'EMBED_OK'; embedding: number[] }
  | { id: number; type: 'EMBED_ERR'; error: string }

// Pipeline is typed broadly so we can call it without TS fighting the overloads.
let extractor: ((text: string, opts: Record<string, unknown>) => Promise<{ data: Float32Array }>) | null = null

async function init() {
  try {
    // q8 quantized model is ~23 MB — first load fetches from HuggingFace Hub and
    // caches in the extension's Cache storage; subsequent loads are instant.
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'q8',
    })
    extractor = pipe as typeof extractor
    postMessage({ type: 'READY' } satisfies OutMsg)
  } catch (err) {
    postMessage({ type: 'INIT_ERR', error: String(err) } satisfies OutMsg)
  }
}

addEventListener('message', async (e: MessageEvent<InMsg>) => {
  const { id, type, text } = e.data
  if (type !== 'EMBED') return

  if (!extractor) {
    postMessage({ id, type: 'EMBED_ERR', error: 'Model not ready' } satisfies OutMsg)
    return
  }

  try {
    const out = await extractor(text, { pooling: 'mean', normalize: true })
    postMessage({ id, type: 'EMBED_OK', embedding: Array.from(out.data) } satisfies OutMsg)
  } catch (err) {
    postMessage({ id, type: 'EMBED_ERR', error: String(err) } satisfies OutMsg)
  }
})

void init()
