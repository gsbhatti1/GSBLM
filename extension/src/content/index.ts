// Content-script entry (LM-02 + LM-12).
// Runs in the page. Two jobs:
//   1. On request, run the orchestrator (extract + AI + task-graph) and return
//      the single NextStepResult. This must run here because extraction and the
//      on-device model live in the page context, not the panel's.
//   2. Refresh-persistence: remember ONLY origin+pathname (the v1 promise).

import { computeNextStep } from '../ui/orchestrator';
import type { WorkerToContent, ContentToWorker } from '../lib/messages';

const PERSIST_KEY = 'lifemode.openOn';

function send(msg: ContentToWorker): void {
  void chrome.runtime.sendMessage(msg);
}

chrome.runtime.onMessage.addListener((raw: unknown, _sender, sendResponse) => {
  const msg = raw as WorkerToContent;
  if (msg?.type === 'COMPUTE_NEXT_STEP') {
    void (async () => {
      try {
        const result = await computeNextStep();
        send({ type: 'NEXT_STEP_RESULT', result });
        sendResponse({ ok: true });
      } catch (e) {
        const reason = e instanceof Error ? e.message : 'unknown error';
        send({ type: 'EXTRACT_FAILED', reason });
        sendResponse({ ok: false });
      }
    })();
    return true; // async sendResponse
  }
  return false;
});

function rememberLocation(): void {
  try {
    const where = `${location.origin}${location.pathname}`;
    void chrome.storage.local.set({ [PERSIST_KEY]: where });
  } catch {
    /* non-fatal */
  }
}

rememberLocation();
