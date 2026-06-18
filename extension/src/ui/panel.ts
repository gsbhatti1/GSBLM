// Panel controller. Wires the tabs and the "Start first step" round-trip.
// The panel cannot touch the page DOM directly, so it asks the worker, which
// drives the content script and relays the extracted page back here.

import type { PanelToWorker, WorkerToPanel } from '../lib/messages';
import { loadMemory, upsertMemory, removeMemory } from '../lib/memory';
import type { MemoryRecord, NextStepResult } from '../lib/types';
import { contactsByKind, type HelpContact } from '../lib/help';
import { makeReader } from '../lib/readaloud';
import { listenOnce, voiceAvailable } from '../lib/voice';

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
    lastResult = msg.result;
    if (pendingVoiceSpeak) {
      pendingVoiceSpeak = false;
      const s = msg.result.step;
      if (voiceAnswer) voiceAnswer.textContent = `${s.title}. ${s.plainExplanation}`;
      reader.speak(`${s.title}. ${s.plainExplanation}`);
    }
    if (explainOut && explainOut.textContent === 'Reading this page…') {
      renderExplain(msg.result);
    }
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

// --- Human help tab (LM-17) ---
let lastResult: NextStepResult | null = null;
const helpResults = document.getElementById('helpResults');

function renderContacts(contacts: HelpContact[]): void {
  if (!helpResults) return;
  helpResults.innerHTML = '';
  if (contacts.length === 0) {
    helpResults.innerHTML = '<p class="step-body muted" style="font-size:14px">No contacts found.</p>';
    return;
  }
  for (const c of contacts) {
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px';
    const name = document.createElement('p');
    name.style.cssText = 'font-weight:600;margin:0 0 4px';
    name.textContent = c.name;
    const desc = document.createElement('p');
    desc.className = 'step-body muted';
    desc.style.cssText = 'font-size:14px;margin:0 0 8px';
    desc.textContent = c.description;
    card.append(name, desc);
    if (c.phone) {
      const tel = document.createElement('a');
      tel.href = `tel:${c.phone.replace(/[^0-9]/g, '')}`;
      tel.textContent = `Call ${c.phone}`;
      tel.style.cssText = 'display:inline-block;margin-right:14px;color:var(--accent)';
      card.append(tel);
    }
    if (c.url) {
      const link = document.createElement('a');
      link.href = c.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Open website';
      link.style.color = 'var(--accent)';
      card.append(link);
    }
    helpResults.append(card);
  }
}

for (const btn of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-help]'))) {
  btn.addEventListener('click', () => {
    const kind = btn.dataset.help as HelpContact['kind'];
    renderContacts(contactsByKind(kind));
  });
}

// Trusted-person handoff (LM-17/LM-19 seed): a CONTENT-FREE summary.
// No page text, no form values, no PII — just which task and which step.
const shareTrusted = document.getElementById('shareTrusted') as HTMLButtonElement | null;
shareTrusted?.addEventListener('click', () => {
  if (!helpResults) return;
  const stepTitle = lastResult?.step.title ?? 'a task';
  const note =
    `I'm working on "${stepTitle}" and could use a hand. ` +
    `Can you help me with this step when you have a moment?`;
  void navigator.clipboard?.writeText(note).catch(() => {});
  helpResults.innerHTML = `<p class="step-body" style="font-size:14px">Copied a short message you can paste to someone you trust:</p><p class="step-body muted" style="font-size:14px">${note}</p>`;
});

// --- Companion tab: Explain this page (LM-13) ---
const explainBtn = document.getElementById('explainBtn') as HTMLButtonElement | null;
const explainOut = document.getElementById('explainOut');

function renderExplain(result: NextStepResult): void {
  if (!explainOut) return;
  const tier = result.aiTier === 'on_device' ? 'on this device' : 'cloud helper';
  explainOut.innerHTML = '';
  const sum = document.createElement('p');
  sum.className = 'step-body';
  sum.style.margin = '0 0 8px';
  sum.textContent = result.summary;
  const tag = document.createElement('p');
  tag.className = 'step-body muted';
  tag.style.cssText = 'font-size:13px;margin:0';
  tag.textContent = `Explained ${tier}.`;
  explainOut.append(sum, tag);
}

explainBtn?.addEventListener('click', () => {
  if (explainOut) explainOut.textContent = 'Reading this page…';
  if (lastResult) {
    renderExplain(lastResult);
  }
  // Always refresh so the explanation reflects the current page.
  const req: PanelToWorker = { type: 'REQUEST_NEXT_STEP' };
  void chrome.runtime.sendMessage(req);
});

// --- Read aloud + Focus mode (LM-14) ---
const reader = makeReader();
const readAloudBtn = document.getElementById('readAloud') as HTMLButtonElement | null;
const focusBtn = document.getElementById('focusMode') as HTMLButtonElement | null;

function currentStepText(): string {
  if (!lastResult) return 'Tap start first step, and I will read this page for you.';
  const s = lastResult.step;
  const need = s.whatYouNeed.length ? ` You'll need: ${s.whatYouNeed.join(', ')}.` : '';
  return `${s.title}. ${s.plainExplanation}${need}`;
}

readAloudBtn?.addEventListener('click', () => {
  if (reader.isSpeaking()) {
    reader.stop();
    readAloudBtn.setAttribute('aria-pressed', 'false');
    readAloudBtn.textContent = 'Read aloud';
    return;
  }
  const started = reader.speak(currentStepText());
  if (started) {
    readAloudBtn.setAttribute('aria-pressed', 'true');
    readAloudBtn.textContent = 'Stop';
  } else {
    readAloudBtn.textContent = 'Read aloud not available';
  }
});

let focusOn = false;
focusBtn?.addEventListener('click', () => {
  focusOn = !focusOn;
  const req: PanelToWorker = { type: 'TOGGLE_FOCUS', on: focusOn };
  void chrome.runtime.sendMessage(req);
  focusBtn.setAttribute('aria-pressed', String(focusOn));
  focusBtn.textContent = focusOn ? 'Focus on' : 'Focus mode';
});

// --- Voice input (LM-15) ---
const askVoiceBtn = document.getElementById('askVoice') as HTMLButtonElement | null;
const voiceStatus = document.getElementById('voiceStatus');
const voiceAnswer = document.getElementById('voiceAnswer');

function setVoiceStatus(text: string): void {
  if (voiceStatus) voiceStatus.textContent = text;
}

askVoiceBtn?.addEventListener('click', async () => {
  if (!voiceAvailable()) {
    setVoiceStatus('Voice input is not available in this browser. You can still type or tap.');
    return;
  }
  setVoiceStatus('Listening… speak your question.');
  if (voiceAnswer) voiceAnswer.textContent = '';

  const outcome = await listenOnce();
  if (!outcome.ok) {
    const messages: Record<string, string> = {
      unavailable: 'Voice input is not available here.',
      denied: 'Microphone access was blocked. You can allow it in your browser settings, or just type.',
      'no-speech': "I didn't catch that. Try again, or tap a button instead.",
      error: 'Something went wrong with voice. You can still use the buttons.',
    };
    setVoiceStatus(messages[outcome.reason]);
    return;
  }

  setVoiceStatus(`You asked: "${outcome.transcript}"`);
  // For now, a spoken question triggers the on-device page explanation and reads it
  // back. Full conversational answers arrive once the cloud AI proxy (LM-23) is live.
  const req: PanelToWorker = { type: 'REQUEST_NEXT_STEP' };
  void chrome.runtime.sendMessage(req);
  if (voiceAnswer) {
    voiceAnswer.textContent = 'Let me look at this page and read you the next step…';
  }
  // When the result returns, speak it.
  pendingVoiceSpeak = true;
});

let pendingVoiceSpeak = false;
