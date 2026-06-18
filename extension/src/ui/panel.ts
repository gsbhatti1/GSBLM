// Panel controller. Wires the tabs and the "Start first step" round-trip.
// The panel cannot touch the page DOM directly, so it asks the worker, which
// drives the content script and relays the extracted page back here.

import type { PanelToWorker, WorkerToPanel } from '../lib/messages';

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab'));
const panels: Record<string, HTMLElement> = {
  stepsPanel: byId('stepsPanel'),
  companionPanel: byId('companionPanel'),
  memoryPanel: byId('memoryPanel'),
  helpPanel: byId('helpPanel'),
};

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing element #${id}`);
  return el;
}

function selectTab(tab: HTMLButtonElement): void {
  for (const t of tabs) t.setAttribute('aria-selected', String(t === tab));
  const target = tab.getAttribute('aria-controls');
  for (const [id, panel] of Object.entries(panels)) panel.hidden = id !== target;
}

for (const tab of tabs) tab.addEventListener('click', () => selectTab(tab));

const getStep = byId('getStep') as HTMLButtonElement;
const stepCard = byId('stepCard');

getStep.addEventListener('click', () => {
  stepCard.innerHTML = '<p class="step-body muted">Reading this page…</p>';
  const msg: PanelToWorker = { type: 'REQUEST_NEXT_STEP' };
  void chrome.runtime.sendMessage(msg);
});

chrome.runtime.onMessage.addListener((raw: unknown) => {
  const msg = raw as WorkerToPanel;
  if (msg?.type === 'NEXT_STEP_READY') {
    const required = msg.page.fields.filter((f) => f.required).length;
    stepCard.innerHTML = '';
    const title = document.createElement('p');
    title.className = 'step-title';
    title.textContent = msg.page.title || 'This page';
    const body = document.createElement('p');
    body.className = 'step-body';
    body.textContent =
      required > 0
        ? `This page has ${required} thing${required === 1 ? '' : 's'} to fill in. Let's take the first one.`
        : 'There is no form to fill here yet. Read the top of the page slowly.';
    stepCard.append(title, body);
  } else if (msg?.type === 'NEXT_STEP_FAILED') {
    stepCard.innerHTML = `<p class="step-body muted">Could not read the page: ${msg.reason}</p>`;
  }
});
