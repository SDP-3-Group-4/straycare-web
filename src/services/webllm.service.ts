/**
 * Anvil-2-PAW WebLLM In-Browser Triage Engine
 * Engineered by Edgeventures for StrayCare
 *
 * Runs client-side 4-bit quantized Qwen-2.5-0.5B via WebGPU.
 * Caches model weights in IndexedDB / CacheStorage for zero-network offline field triage.
 */

import type { MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";

export const ANVIL_2_MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

export const ANVIL_2_SYSTEM_PROMPT = `You are Anvil 2, the specialized veterinary triage AI engineered by Edgeventures for the StrayCare platform.
You provide immediate, life-saving first-aid guidance, symptom evaluation, and emergency triage for pet owners and stray animal rescuers.

CRITICAL PROTOCOLS & GUARDRAILS:
1. You are NOT a licensed veterinarian and you NEVER pose as one. Always emphasize that your advice is emergency stabilization until professional veterinary examination is reached.
2. NEVER prescribe prescription-only medications, antibiotics, or systemic NSAIDs without veterinary supervision.
3. Explicitly warn against common fatal errors (e.g., Paracetamol/Tylenol is lethal to cats; never induce vomiting if caustic chemicals or sharp objects were ingested).
4. Maintain a calm, authoritative, compassionate tone.
5. Strictly structure emergency responses with the following triage schema:
   [URGENCY LEVEL]: CRITICAL | URGENT | MONITOR | SAFE
   [INITIAL ASSESSMENT]: Concise clinical breakdown of what is likely occurring.
   [IMMEDIATE SAFE FIRST-AID]: Step-by-step actions for the rescuer.
   [WHAT TO TELL THE VET]: Critical vital signs and observations to report to the clinic.`;

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
 * Generates an offline clinical emergency triage response using the client-side engine
 */
export async function generateOfflineTriage(
  chatHistory: Array<{ role: string; content: string }>,
): Promise<string> {
  const engine = await downloadAndInitModel();

  // Ensure Anvil 2 system prompt is prepended
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
    temperature: 0.3,
    max_tokens: 512,
  });

  return (
    reply.choices[0]?.message?.content ||
    "[URGENCY LEVEL]: MONITOR\n[INITIAL ASSESSMENT]: Unable to generate full clinical report."
  );
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
