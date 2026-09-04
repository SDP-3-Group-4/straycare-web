/**
 * Anvil-2-PAW WebLLM In-Browser Triage Engine
 * Engineered by Edgeventures for StrayCare
 *
 * Runs client-side 4-bit quantized Qwen-2.5-0.5B via WebGPU.
 * Caches model weights in IndexedDB / CacheStorage for zero-network offline field triage.
 */

import type { MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";

export const ANVIL_2_MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

export const ANVIL_2_SYSTEM_PROMPT = `You are Anvil 2, an AI veterinary triage assistant built into the StrayCare app by Edgeventures.
You are a chat assistant — NOT a veterinarian, NOT the user's vet, and you have NO prior history with this pet or owner.

STRICT RULES — NEVER BREAK THESE:
1. NEVER say "we", "our clinic", "your last visit", "bring him in to us", or anything implying you are their vet or have met this animal before. You are a chat AI.
2. NEVER end a response with a generic follow-up question like "What's your pet doing today?" or "How is your pet feeling?". You already have the user's message — respond to it directly.
3. NEVER repeat a follow-up question you already asked in the same conversation.
4. Do NOT repeat advice already given earlier in the conversation.
5. NEVER pretend to prescribe or diagnose. Clearly state you are an AI triage assistant providing first-aid guidance only.
6. NEVER recommend Paracetamol/Tylenol/Acetaminophen — it is lethal to cats. Never induce vomiting if caustic chemicals or sharp objects were ingested.

HOW TO RESPOND:
- Read what the user actually said and respond SPECIFICALLY to it. Do not give generic filler advice.
- If this is the first mention of a symptom or problem, assess it clinically: is it CRITICAL, URGENT, or MONITOR-level? Say so clearly.
- Give practical, specific first-aid steps the owner can take RIGHT NOW.
- Tell them what to watch for that would escalate urgency.
- If symptoms across the conversation suggest worsening (e.g. sneezing + now sleeping all day), connect the dots and elevate your urgency assessment.
- Be warm and human but direct. Keep responses concise — do not pad with unnecessary sentences.
- Only ask a follow-up question if you genuinely need missing information to give better advice, and only ask ONE specific question at a time.`;



export interface WebLLMStatus {
  status: "idle" | "checking" | "downloading" | "ready" | "error";
  progress: number; // 0 - 100
  progressText: string;
  error?: string | null;
  isCached: boolean;
  modelId: string;
}

let engineInstance: MLCEngine | null = null;
let enginePromise: Promise<MLCEngine> | null = null;

let currentStatus: WebLLMStatus = {
  status: "idle",
  progress: 0,
  progressText: "Model not downloaded",
  error: null,
  isCached: false,
  modelId: ANVIL_2_MODEL_ID,
};

const listeners = new Set<(status: WebLLMStatus) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentStatus }));
}

export function subscribeWebLLMStatus(
  listener: (status: WebLLMStatus) => void,
): () => void {
  listeners.add(listener);
  listener({ ...currentStatus });
  return () => listeners.delete(listener);
}

export function getWebLLMStatus(): WebLLMStatus {
  return { ...currentStatus };
}

/**
 * Checks if the browser environment supports WebGPU
 */
export function isWebGPUSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/**
 * Verifies whether the Anvil-2-PAW model has already been cached in browser storage
 */
export async function checkModelCached(): Promise<boolean> {
  try {
    currentStatus.status = "checking";
    notifyListeners();

    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await window.caches.keys();
      const hasWebLLMCache = keys.some(
        (k) => k.includes("webllm") || k.includes("mlc"),
      );
      if (hasWebLLMCache) {
        currentStatus.isCached = true;
        currentStatus.status = engineInstance ? "ready" : "idle";
        currentStatus.progressText = "Model cached in browser storage";
        notifyListeners();
        return true;
      }
    }
  } catch (e) {
    console.warn("Could not check WebLLM cache:", e);
  }

  currentStatus.isCached = false;
  if (!engineInstance) {
    currentStatus.status = "idle";
    currentStatus.progressText = "Model not downloaded";
  }
  notifyListeners();
  return false;
}

/**
 * Downloads and initializes the WebLLM engine with live progress reporting
 */
export async function downloadAndInitModel(
  onProgress?: (progress: number, text: string) => void,
): Promise<MLCEngine> {
  if (engineInstance) {
    currentStatus.status = "ready";
    currentStatus.progress = 100;
    currentStatus.progressText = "Engine Ready";
    currentStatus.isCached = true;
    notifyListeners();
    return engineInstance;
  }

  if (enginePromise) {
    return enginePromise;
  }

  if (!isWebGPUSupported()) {
    const errorMsg =
      "WebGPU is not supported in this browser. Please use Chrome, Edge, or a WebGPU-enabled browser.";
    currentStatus.status = "error";
    currentStatus.error = errorMsg;
    notifyListeners();
    throw new Error(errorMsg);
  }

  currentStatus.status = "downloading";
  currentStatus.progress = 0;
  currentStatus.progressText = "Connecting to Hugging Face...";
  currentStatus.error = null;
  notifyListeners();

  enginePromise = (async () => {
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

      const engine = await CreateMLCEngine(ANVIL_2_MODEL_ID, {
        initProgressCallback: (report: InitProgressReport) => {
          const pct = Math.min(100, Math.round((report.progress || 0) * 100));
          currentStatus.progress = pct;
          currentStatus.progressText = report.text || "Loading model...";
          if (onProgress) {
            onProgress(pct, currentStatus.progressText);
          }
          notifyListeners();
        },
      });

      engineInstance = engine;
      currentStatus.status = "ready";
      currentStatus.progress = 100;
      currentStatus.progressText = "Model ready & cached in IndexedDB";
      currentStatus.isCached = true;
      notifyListeners();
      return engine;
    } catch (err: any) {
      console.error("Failed to load WebLLM model:", err);
      engineInstance = null;
      enginePromise = null;
      currentStatus.status = "error";
      currentStatus.error =
        err?.message || "Failed to download WebLLM model weights.";
      notifyListeners();
      throw err;
    }
  })();

  return enginePromise;
}

/**
 * Generates an offline clinical triage response using the client-side engine (non-streaming)
 */
export async function generateOfflineTriage(
  chatHistory: Array<{ role: string; content: string }>,
): Promise<string> {
  const engine = await downloadAndInitModel();

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  const hasSystem = chatHistory.some((m) => m.role === "system");
  if (!hasSystem) {
    messages.push({ role: "system", content: ANVIL_2_SYSTEM_PROMPT });
  }

  for (const m of chatHistory) {
    if (m.role === "system" || m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: m.content });
    }
  }

  const reply = await engine.chat.completions.create({
    messages,
    temperature: 0.65,
    max_tokens: 1024,
  });

  return (
    reply.choices[0]?.message?.content ||
    "I wasn't able to generate a response. Please try again."
  );
}

/**
 * Streaming version — calls onChunk with each token as it arrives.
 * Returns the full accumulated response string when done.
 */
export async function generateOfflineTriageStream(
  chatHistory: Array<{ role: string; content: string }>,
  onChunk: (token: string, accumulated: string) => void,
): Promise<string> {
  const engine = await downloadAndInitModel();

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  const hasSystem = chatHistory.some((m) => m.role === "system");
  if (!hasSystem) {
    messages.push({ role: "system", content: ANVIL_2_SYSTEM_PROMPT });
  }

  for (const m of chatHistory) {
    if (m.role === "system" || m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: m.content });
    }
  }

  const stream = await engine.chat.completions.create({
    messages,
    temperature: 0.65,
    max_tokens: 1024,
    stream: true,
  });

  let accumulated = "";
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      accumulated += token;
      onChunk(token, accumulated);
    }
  }

  return accumulated || "I wasn't able to generate a response. Please try again.";
}

/**
 * Clears cached WebLLM model weights to free up browser disk space
 */
export async function clearWebLLMCache(): Promise<void> {
  if (typeof window !== "undefined" && "caches" in window) {
    const keys = await window.caches.keys();
    for (const key of keys) {
      if (key.includes("webllm") || key.includes("mlc")) {
        await window.caches.delete(key);
      }
    }
  }

  // Also clear IndexedDB databases starting with webllm
  if (typeof indexedDB !== "undefined" && indexedDB.databases) {
    try {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name && (db.name.includes("webllm") || db.name.includes("mlc"))) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (e) {
      console.warn("Error deleting IndexedDB:", e);
    }
  }

  engineInstance = null;
  enginePromise = null;
  currentStatus.status = "idle";
  currentStatus.progress = 0;
  currentStatus.progressText = "Cache cleared";
  currentStatus.isCached = false;
  notifyListeners();
}
