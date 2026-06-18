// Service worker (LM-03 + LM-12).
// Broker between panel and the page's content script.
//   - Toolbar click opens the side panel.
//   - Panel asks for the next step -> worker tells the active tab to compute it
//     -> worker relays the NextStepResult back to the panel.

import { setAnalyticsConsent } from '../lib/analytics';
import type {
  PanelToWorker,
  ContentToWorker,
  WorkerToPanel,
} from '../lib/messages';

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.windowId !== undefined) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

async function activeTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

function toPanel(msg: WorkerToPanel): void {
  void chrome.runtime.sendMessage(msg);
}

chrome.runtime.onMessage.addListener((raw: unknown, _sender, sendResponse) => {
  const msg = raw as PanelToWorker | ContentToWorker;

  if (msg?.type === 'REQUEST_NEXT_STEP') {
    void (async () => {
      const tabId = await activeTabId();
      if (tabId === undefined) {
        toPanel({ type: 'NEXT_STEP_FAILED', reason: 'no active tab' });
        return;
      }
      try {
        await chrome.tabs.sendMessage(tabId, { type: 'COMPUTE_NEXT_STEP' });
      } catch {
        toPanel({
          type: 'NEXT_STEP_FAILED',
          reason: 'cannot reach page (try refreshing it)',
        });
      }
    })();
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === 'NEXT_STEP_RESULT') {
    toPanel({ type: 'NEXT_STEP_READY', result: msg.result });
    return false;
  }
  if (msg?.type === 'EXTRACT_FAILED') {
    toPanel({ type: 'NEXT_STEP_FAILED', reason: msg.reason });
    return false;
  }

  if (msg?.type === 'SET_ANALYTICS_CONSENT') {
    setAnalyticsConsent(msg.on);
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === 'TOGGLE_FOCUS') {
    void (async () => {
      const tabId = await activeTabId();
      if (tabId !== undefined) {
        try {
          await chrome.tabs.sendMessage(tabId, { type: 'SET_FOCUS', on: msg.on });
        } catch {
          /* page not reachable; non-fatal */
        }
      }
    })();
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
