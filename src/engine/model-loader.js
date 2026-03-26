// ──────────────────────────────────────────────────────
// Transformers.js Model Loader (Singleton)
// Loads Xenova/paraphrase-multilingual-MiniLM-L12-v2
// ──────────────────────────────────────────────────────

import { logger } from './logger.js';

let pipeline = null;
let modelInstance = null;
let modelStatus = "idle"; // idle, loading, ready, error
let statusCallbacks = [];

function notifyStatus(status) {
  modelStatus = status;
  for (const cb of statusCallbacks) cb(status);
}

export function onModelStatus(callback) {
  statusCallbacks.push(callback);
  callback(modelStatus);
  return () => { statusCallbacks = statusCallbacks.filter(c => c !== callback); };
}

export function getModelStatus() {
  return modelStatus;
}

export async function loadModel() {
  if (modelInstance) return modelInstance;
  if (modelStatus === "loading") {
    return new Promise((resolve) => {
      const unsub = onModelStatus((s) => {
        if (s === "ready") { unsub(); resolve(modelInstance); }
        if (s === "error") { unsub(); resolve(null); }
      });
    });
  }

  notifyStatus("loading");

  try {
    const { pipeline: createPipeline } = await import("@huggingface/transformers");
    pipeline = createPipeline;
    modelInstance = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2", {
      quantized: true,
    });
    notifyStatus("ready");
    return modelInstance;
  } catch (e) {
    logger.warn("Transformers.js model loading failed:", e.message);
    notifyStatus("error");
    return null;
  }
}

export async function embedText(text) {
  const model = await loadModel();
  if (!model) return null;
  try {
    const output = await model(text, { pooling: "mean", normalize: true });
    return output.data;
  } catch (e) {
    logger.warn("Embedding failed:", e.message);
    return null;
  }
}

export async function embedSentences(sentences) {
  const model = await loadModel();
  if (!model) return null;
  try {
    const results = [];
    for (const s of sentences) {
      const output = await model(s, { pooling: "mean", normalize: true });
      results.push(output.data);
    }
    return results;
  } catch (e) {
    logger.warn("Batch embedding failed:", e.message);
    return null;
  }
}

// Start loading in background
export function preloadModel() {
  if (modelStatus === "idle") {
    loadModel().catch(() => {});
  }
}
