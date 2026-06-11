const LIFEMODE_PANEL_ID = 'gsb-lifemode-panel';
const FOCUS_CLASS = 'gsb-lifemode-focus';

chrome.runtime.onMessage.addListener((message) => {
  if (!message || !message.type) return;

  if (message.type === 'OPEN_LIFEMODE') {
    openLifeModePanel();
  }

  if (message.type === 'TOGGLE_FOCUS_MODE') {
    toggleFocusMode();
  }
});

function openLifeModePanel() {
  const existing = document.getElementById(LIFEMODE_PANEL_ID);
  if (existing) {
    existing.classList.toggle('is-open');
    return;
  }

  const panel = document.createElement('aside');
  panel.id = LIFEMODE_PANEL_ID;
  panel.className = 'is-open';
  panel.setAttribute('aria-label', 'LifeMode helper panel');

  panel.innerHTML = `
    <div class="lm-panel-header">
      <div>
        <p class="lm-kicker">GSB LifeMode</p>
        <h2>One clear next step.</h2>
      </div>
      <button type="button" class="lm-close" aria-label="Close LifeMode">×</button>
    </div>

    <p class="lm-intro">This page may have a lot on it. I can turn it into a simple checklist.</p>

    <div class="lm-actions">
      <button type="button" data-action="scan">Make checklist</button>
      <button type="button" data-action="focus">Focus mode</button>
      <button type="button" data-action="read">Read aloud</button>
      <button type="button" data-action="copy">Copy checklist</button>
    </div>

    <section class="lm-card" aria-labelledby="lm-next-step-title">
      <h3 id="lm-next-step-title">Next step</h3>
      <p id="lm-next-step">Press “Make checklist.”</p>
    </section>

    <section class="lm-card" aria-labelledby="lm-checklist-title">
      <h3 id="lm-checklist-title">Checklist</h3>
      <ol id="lm-checklist">
        <li>Open LifeMode.</li>
        <li>Make a checklist.</li>
        <li>Do one step.</li>
      </ol>
    </section>

    <p id="lm-status" class="lm-status" role="status" aria-live="polite"></p>
  `;

  document.documentElement.appendChild(panel);

  panel.querySelector('.lm-close').addEventListener('click', () => {
    panel.classList.remove('is-open');
  });

  panel.querySelector('[data-action="scan"]').addEventListener('click', () => {
    const items = buildChecklist();
    renderChecklist(items);
    setStatus('Checklist ready. Start with the first step.');
  });

  panel.querySelector('[data-action="focus"]').addEventListener('click', () => {
    toggleFocusMode();
  });

  panel.querySelector('[data-action="read"]').addEventListener('click', () => {
    readPageSummary();
  });

  panel.querySelector('[data-action="copy"]').addEventListener('click', () => {
    copyChecklist();
  });
}

function toggleFocusMode() {
  document.documentElement.classList.toggle(FOCUS_CLASS);
  const enabled = document.documentElement.classList.contains(FOCUS_CLASS);
  chrome.storage.local.set({ focusMode: enabled });
  setStatus(enabled ? 'Focus mode is on.' : 'Focus mode is off.');
}

function buildChecklist() {
  const items = [];
  const requiredFields = getRequiredFields();

  if (requiredFields.length > 0) {
    requiredFields.slice(0, 6).forEach((label) => {
      items.push(`Fill required field: ${label}`);
    });
  }

  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map((el) => cleanText(el.textContent))
    .filter(Boolean)
    .slice(0, 5);

  headings.forEach((heading) => {
    items.push(`Review section: ${heading}`);
  });

  const primaryButtons = Array.from(document.querySelectorAll('button, input[type="submit"], a'))
    .map((el) => cleanText(el.innerText || el.value || el.getAttribute('aria-label') || el.textContent))
    .filter((text) => isActionText(text))
    .slice(0, 5);

  primaryButtons.forEach((text) => {
    items.push(`Look for action: ${text}`);
  });

  const unique = Array.from(new Set(items)).slice(0, 10);

  if (unique.length === 0) {
    return [
      'Read the page title.',
      'Find the first form, button, or instruction.',
      'Do only the next visible step.',
    ];
  }

  return unique;
}

function getRequiredFields() {
  const fields = Array.from(document.querySelectorAll('input, select, textarea'));

  return fields
    .filter((field) => field.required || field.getAttribute('aria-required') === 'true')
    .map((field) => getFieldLabel(field))
    .filter(Boolean);
}

function getFieldLabel(field) {
  if (field.id) {
    const label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (label) return cleanText(label.textContent);
  }

  const wrappedLabel = field.closest('label');
  if (wrappedLabel) return cleanText(wrappedLabel.textContent);

  return cleanText(
    field.getAttribute('aria-label') ||
    field.getAttribute('placeholder') ||
    field.name ||
    field.id ||
    'unnamed field'
  );
}

function renderChecklist(items) {
  const list = document.getElementById('lm-checklist');
  const nextStep = document.getElementById('lm-next-step');

  if (!list || !nextStep) return;

  list.innerHTML = '';

  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });

  nextStep.textContent = items[0] || 'Take one small step on this page.';
}

function readPageSummary() {
  const nextStep = document.getElementById('lm-next-step')?.textContent || '';
  const items = getChecklistText();
  const text = `LifeMode. Next step. ${nextStep}. Checklist. ${items}`;

  if (!('speechSynthesis' in window)) {
    setStatus('Read aloud is not available in this browser.');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
  setStatus('Reading aloud.');
}

async function copyChecklist() {
  const text = getChecklistText();

  try {
    await navigator.clipboard.writeText(text);
    setStatus('Checklist copied.');
  } catch (error) {
    setStatus('Could not copy checklist.');
  }
}

function getChecklistText() {
  return Array.from(document.querySelectorAll('#lm-checklist li'))
    .map((item, index) => `${index + 1}. ${item.textContent}`)
    .join('\n');
}

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

function isActionText(text) {
  const value = cleanText(text).toLowerCase();
  if (!value || value.length < 2 || value.length > 80) return false;

  return [
    'submit',
    'continue',
    'next',
    'save',
    'apply',
    'send',
    'upload',
    'download',
    'sign in',
    'log in',
    'start',
    'finish',
    'review',
  ].some((word) => value.includes(word));
}

function setStatus(message) {
  const status = document.getElementById('lm-status');
  if (status) status.textContent = message;
}

chrome.storage.local.get(['focusMode']).then((settings) => {
  if (settings.focusMode) {
    document.documentElement.classList.add(FOCUS_CLASS);
  }
});
