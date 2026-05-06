const EMBED_CACHE_KEY = 'embedding:cv:v1'

interface EmbeddingCache {
  textHash: string
  embedding: number[]
  computedAt: number
}

// djb2 — fast, good-enough for cache-invalidation (not security).
function hashText(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = (((h << 5) + h) ^ text.charCodeAt(i)) >>> 0
  return String(h)
}

// Embeddings from all-MiniLM-L6-v2 are already L2-normalised (normalize:true),
// so cosine similarity equals the dot product. We keep the full formula in case
// the cache stores embeddings from before normalisation was guaranteed.
function cosineSim(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

type PendingCb = (embedding: number[] | null) => void

interface WorkerMsg {
  type: string
  id?: number
  embedding?: number[]
  error?: string
}

class SemanticMatcher {
  private worker: Worker | null = null
  // Resolves true = ready, false = failed (WASM/ONNX init error).
  private readyPromise: Promise<boolean> | null = null
  private pending = new Map<number, PendingCb>()
  private nextId = 1

  // Lazily create the worker — only on the first embed request.
  private initWorker(): Promise<boolean> {
    if (this.readyPromise) return this.readyPromise

    this.readyPromise = new Promise((resolve) => {
      const w = new Worker(
        new URL('./semantic.worker.ts', import.meta.url),
        { type: 'module' },
      )
      this.worker = w

      w.addEventListener('message', (e: MessageEvent<WorkerMsg>) => {
        const msg = e.data
        if (msg.type === 'READY') { resolve(true); return }
        if (msg.type === 'INIT_ERR') {
          resolve(false)
          // Drain any queued embeds that arrived before INIT_ERR.
          for (const cb of this.pending.values()) cb(null)
          this.pending.clear()
          return
        }
        if (msg.id === undefined) return
        const cb = this.pending.get(msg.id)
        if (!cb) return
        this.pending.delete(msg.id)
        cb(msg.type === 'EMBED_OK' ? (msg.embedding ?? null) : null)
      })

      w.addEventListener('error', () => resolve(false))
    })

    return this.readyPromise
  }

  private async embed(text: string): Promise<number[] | null> {
    const ready = await this.initWorker()
    if (!ready || !this.worker) return null
    return new Promise<number[] | null>((resolve) => {
      const id = this.nextId++
      this.pending.set(id, resolve)
      this.worker!.postMessage({ id, type: 'EMBED', text })
    })
  }

  // Returns the CV embedding from cache if the text hasn't changed, otherwise
  // re-embeds and writes back to chrome.storage.local.
  async getCvEmbedding(cvText: string): Promise<number[] | null> {
    const hash = hashText(cvText)
    const stored = await chrome.storage.local.get(EMBED_CACHE_KEY)
    const cache = stored[EMBED_CACHE_KEY] as EmbeddingCache | undefined
    if (cache?.textHash === hash) return cache.embedding

    const embedding = await this.embed(cvText)
    if (embedding) {
      const entry: EmbeddingCache = { textHash: hash, embedding, computedAt: Date.now() }
      await chrome.storage.local.set({ [EMBED_CACHE_KEY]: entry })
    }
    return embedding
  }

  async similarity(cvText: string, jdText: string): Promise<number | null> {
    try {
      const [cvEmb, jdEmb] = await Promise.all([
        this.getCvEmbedding(cvText),
        this.embed(jdText),
      ])
      if (!cvEmb || !jdEmb) return null
      return cosineSim(cvEmb, jdEmb)
    } catch {
      return null
    }
  }
}

let instance: SemanticMatcher | null = null

// Falls back to null (caller uses TF-cosine) if the worker fails to initialise
// or if WebAssembly is blocked.
export function getSemanticSimilarity(cvText: string, jdText: string): Promise<number | null> {
  instance ??= new SemanticMatcher()
  return instance.similarity(cvText, jdText)
}
