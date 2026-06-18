// Service worker (LM-03).
// The broker between the panel and the page's content script.
//   - Toolbar click opens the side panel.
//   - Panel asks for the next step -> worker tells the active tab's content script
//     to extract -> worker relays the result back to the panel.
//   - Worker also forwards analytics-consent changes.

import { setAnalyticsConsent } from '../lib/analytics';
import type {
  PanelToWorker,
  ContentToWorker,
  WorkerToPanel,
} from '../lib/messages';

// Open the side panel when the toolbar icon is clicked.
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

  // From the panel: kick off extraction on the active tab.
  if (msg?.type === 'REQUEST_NEXT_STEP') {
    void (async () => {
      const tabId = await activeTabId();
      if (tabId === undefined) {
        toPanel({ type: 'NEXT_STEP_FAILED', reason: 'no active tab' });
        return;
      }
      try {
        await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_PAGE' });
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

  // From the content script: relay the extracted page up to the panel.
  if (msg?.type === 'PAGE_EXTRACTED') {
    toPanel({ type: 'NEXT_STEP_READY', page: msg.page });
    return false;
  }
  if (msg?.type === 'EXTRACT_FAILED') {
    toPanel({ type: 'NEXT_STEP_FAILED', reason: msg.reason });
    return false;
  }

  // Analytics consent toggle from the panel.
  if (msg?.type === 'SET_ANALYTICS_CONSENT') {
    setAnalyticsConsent(msg.on);
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
