import { pipeline, env } from '@huggingface/transformers';

// Disable checking for local models since they are cached in browser storage.
// This forces loading from Hugging Face's CDN.
env.allowLocalModels = false;

let embedPipeline: any = null;
let summaryPipeline: any = null;

// Report loading progress to the main thread
const progressCallback = (data: any) => {
  if (data.status === 'progress') {
    self.postMessage({
      type: 'progress',
      payload: {
        file: data.file,
        progress: data.progress,
        loaded: data.loaded,
        total: data.total
      }
    });
  }
};

async function getEmbedPipeline() {
  if (!embedPipeline) {
    embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: progressCallback
    });
  }
  return embedPipeline;
}

async function getSummaryPipeline() {
  if (!summaryPipeline) {
    summaryPipeline = await pipeline('summarization', 'Xenova/distilbart-xsum-12-1', {
      progress_callback: progressCallback
    });
  }
  return summaryPipeline;
}

async function generateSummary(text: string) {
  const summarizer = await getSummaryPipeline();
  // Using chunk_length and stride to process long articles seamlessly
  const output = await summarizer(text, {
    max_new_tokens: 120,
    min_new_tokens: 30,
    chunk_length: 500,
    stride: 50
  });
  return output[0].summary_text;
}

async function generateEmbeddings(texts: string[]) {
  const extractor = await getEmbedPipeline();
  const embeddings: number[][] = [];
  
  for (const text of texts) {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    embeddings.push(Array.from(output.data));
  }
  
  return embeddings;
}

self.onmessage = async (event: MessageEvent) => {
  const { id, type, payload } = event.data;

  try {
    if (type === 'init') {
      self.postMessage({ type: 'status', payload: 'Initializing models...' });
      await getEmbedPipeline();
      await getSummaryPipeline();
      self.postMessage({ id, type: 'init_done' });
    } else if (type === 'summarize') {
      const summary = await generateSummary(payload.text);
      self.postMessage({ id, type: 'summarize_done', payload: { summary } });
    } else if (type === 'embed') {
      const embeddings = await generateEmbeddings(payload.texts);
      self.postMessage({ id, type: 'embed_done', payload: { embeddings } });
    }
  } catch (error: any) {
    console.error("Worker error:", error);
    self.postMessage({ id, type: 'error', payload: { error: error.message } });
  }
};
