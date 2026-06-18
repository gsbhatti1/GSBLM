// Content-script entry (LM-02).
// Runs in the page. Two jobs:
//   1. On request from the worker, extract the page into a structured model.
//   2. Refresh-persistence: remember ONLY origin+pathname so the panel can reopen
//      where it was open (the v1 promise — no page text, no form values, no query).

import { extractPage } from './extract';
import type { WorkerToContent, ContentToWorker } from '../lib/messages';

const PERSIST_KEY = 'lifemode.openOn';

function send(msg: ContentToWorker): void {
  void chrome.runtime.sendMessage(msg);
}

chrome.runtime.onMessage.addListener((raw: unknown, _sender, sendResponse) => {
  const msg = raw as WorkerToContent;
  if (msg?.type === 'EXTRACT_PAGE') {
    try {
      const page = extractPage();
      send({ type: 'PAGE_EXTRACTED', page });
      sendResponse({ ok: true });
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'unknown extract error';
      send({ type: 'EXTRACT_FAILED', reason });
      sendResponse({ ok: false });
    }
  }
  return true; // keep the message channel open for async sendResponse
});

// Refresh-persistence: store only where we are, nothing about what's on the page.
function rememberLocation(): void {
  try {
    const where = `${location.origin}${location.pathname}`;
    void chrome.storage.local.set({ [PERSIST_KEY]: where });
  } catch {
    /* storage may be unavailable in some sandboxes; non-fatal */
  }
}

rememberLocation();
