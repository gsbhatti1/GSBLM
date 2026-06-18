// Panel controller. Wires the tabs and the "Start first step" round-trip.
// The panel cannot touch the page DOM directly, so it asks the worker, which
// drives the content script and relays the extracted page back here.

import type { PanelToWorker, WorkerToPanel } from '../lib/messages';
import { loadMemory, upsertMemory, removeMemory } from '../lib/memory';
import type { MemoryRecord } from '../lib/types';

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
    const { step, summary, matchedKnownProcess, aiTier } = msg.result;
    stepCard.innerHTML = '';

    const sum = document.createElement('p');
    sum.className = 'step-body muted';
    sum.style.marginTop = '0';
    sum.textContent = summary;

    const title = document.createElement('p');
    title.className = 'step-title';
    title.textContent = step.title;

    const body = document.createElement('p');
    body.className = 'step-body';
    body.textContent = step.plainExplanation;

    stepCard.append(sum, title, body);

    if (step.whatYouNeed.length > 0) {
      const need = document.createElement('p');
      need.className = 'step-body muted';
      need.textContent = `You'll need: ${step.whatYouNeed.join(', ')}`;
      stepCard.append(need);
    }

    const tag = document.createElement('p');
    tag.className = 'step-body muted';
    tag.style.fontSize = '13px';
    tag.style.marginTop = '12px';
    tag.textContent = matchedKnownProcess
      ? `Recognized process · helper: ${aiTier === 'on_device' ? 'on this device' : 'cloud'}`
      : `General guidance · helper: ${aiTier === 'on_device' ? 'on this device' : 'cloud'}`;
    stepCard.append(tag);
  } else if (msg?.type === 'NEXT_STEP_FAILED') {
    stepCard.innerHTML = `<p class="step-body muted">Could not read the page: ${msg.reason}</p>`;
  }
});

// --- Memory tab (LM-16) ---
const memLabel = document.getElementById('memLabel') as HTMLInputElement | null;
const memValue = document.getElementById('memValue') as HTMLInputElement | null;
const memSensitive = document.getElementById('memSensitive') as HTMLInputElement | null;
const memSave = document.getElementById('memSave') as HTMLButtonElement | null;
const memList = document.getElementById('memList');

function keyFromLabel(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'fact';
}

function renderMemory(records: MemoryRecord[]): void {
  if (!memList) return;
  memList.innerHTML = '';
  if (records.length === 0) {
    memList.innerHTML = '<p class="step-body muted" style="font-size:14px">No saved facts yet.</p>';
    return;
  }
  for (const r of records) {
    const row = document.createElement('div');
    row.className = 'help-row';
    const text = document.createElement('span');
    text.style.fontSize = '15px';
    const shown = r.sensitive ? '••••••' : r.value;
    text.textContent = `${r.label}: ${shown}`;
    const del = document.createElement('button');
    del.className = 'secondary';
    del.type = 'button';
    del.textContent = 'Remove';
    del.addEventListener('click', () => {
      void removeMemory(r.key).then(renderMemory);
    });
    row.append(text, del);
    memList.append(row);
  }
}

memSave?.addEventListener('click', () => {
  const label = memLabel?.value.trim() ?? '';
  const value = memValue?.value.trim() ?? '';
  if (!label || !value) return;
  const record: MemoryRecord = {
    key: keyFromLabel(label),
    label,
    value,
    sensitive: memSensitive?.checked ?? false,
  };
  void upsertMemory(record).then((all) => {
    renderMemory(all);
    if (memLabel) memLabel.value = '';
    if (memValue) memValue.value = '';
    if (memSensitive) memSensitive.checked = false;
  });
});

void loadMemory().then(renderMemory);
