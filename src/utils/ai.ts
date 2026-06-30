let worker: Worker | null = null;
let onProgressListener: ((data: any) => void) | null = null;
let nextRequestId = 0;
const pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (err: any) => void }>();

function getWorker() {
  if (typeof window === 'undefined') return null;
  
  if (!worker) {
    // Instantiate worker as ES Module using Vite's URL asset format
    worker = new Worker(
      new URL('../workers/ai.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent) => {
      const { id, type, payload } = event.data;

      if (type === 'progress') {
        if (onProgressListener) {
          onProgressListener(payload);
        }
        return;
      }

      if (type === 'status') {
        return;
      }

      const pending = pendingRequests.get(id);
      if (pending) {
        pendingRequests.delete(id);
        if (type === 'error') {
          pending.reject(new Error(payload.error));
        } else if (type === 'init_done') {
          pending.resolve(undefined);
        } else if (type === 'summarize_done') {
          pending.resolve(payload.summary);
        } else if (type === 'embed_done') {
          pending.resolve(payload.embeddings);
        }
      }
    };
  }
  return worker;
}

export function initAI(onProgress?: (data: any) => void): Promise<void> {
  if (onProgress) {
    onProgressListener = onProgress;
  }
  const w = getWorker();
  if (!w) return Promise.reject(new Error("Worker cannot be initialized on server"));
  
  const id = `init_${nextRequestId++}`;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    w.postMessage({ id, type: 'init' });
  });
}

export function summarizeText(text: string): Promise<string> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("Worker is not available"));
  
  const id = `sum_${nextRequestId++}`;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    w.postMessage({ id, type: 'summarize', payload: { text } });
  });
}

export function getEmbeddings(texts: string[]): Promise<number[][]> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("Worker is not available"));
  
  const id = `emb_${nextRequestId++}`;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    w.postMessage({ id, type: 'embed', payload: { texts } });
  });
}
