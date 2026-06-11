const LIFEMODE_PANEL_ID = 'gsb-lifemode-panel';
const FOCUS_CLASS = 'gsb-lifemode-focus';
const TARGET_CLASS = 'gsb-lifemode-target';

const lifeModeState = {
  items: [],
  model: null,
  highlightedElement: null,
  noteKey: '',
};

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
    existing.classList.add('is-open');
    runScan();
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
      <button type="button" class="lm-close" aria-label="Close LifeMode">x</button>
    </div>

    <p class="lm-intro">This page may have a lot on it. I can turn it into a simple path.</p>

    <section class="lm-card lm-summary-card" aria-labelledby="lm-summary-title">
      <div id="lm-page-type" class="lm-badge">Scanning page</div>
      <h3 id="lm-summary-title">Page rescue</h3>
      <p id="lm-summary">Open LifeMode, then start with one step.</p>
    </section>

    <div class="lm-actions">
      <button type="button" data-action="scan">Refresh checklist</button>
      <button type="button" data-action="start">Start first step</button>
      <button type="button" data-action="focus">Focus mode</button>
      <button type="button" data-action="read">Read aloud</button>
      <button type="button" data-action="copy">Copy handoff</button>
      <button type="button" data-action="stop">Stop reading</button>
    </div>

    <section class="lm-card lm-next-card" aria-labelledby="lm-next-step-title">
      <h3 id="lm-next-step-title">Next step</h3>
      <p id="lm-next-step">Press Refresh checklist.</p>
    </section>

    <section class="lm-card" aria-labelledby="lm-checklist-title">
      <h3 id="lm-checklist-title">Checklist</h3>
      <ol id="lm-checklist">
        <li>Open LifeMode.</li>
        <li>Refresh the checklist.</li>
        <li>Do one step.</li>
      </ol>
    </section>

    <section class="lm-card" aria-labelledby="lm-note-title">
      <h3 id="lm-note-title">Memory note</h3>
      <p class="lm-note-help">Write one thing you do not want to forget on this page. Saved only in this browser.</p>
      <textarea id="lm-note" rows="3" placeholder="Example: Come back and upload ID tomorrow."></textarea>
      <div class="lm-note-actions">
        <button type="button" data-action="save-note">Save note</button>
        <button type="button" data-action="clear-note">Clear</button>
      </div>
    </section>

    <p id="lm-status" class="lm-status" role="status" aria-live="polite"></p>
  `;

  document.documentElement.appendChild(panel);
  bindPanelActions(panel);
  prepareMemoryNote();
  runScan();
}

function bindPanelActions(panel) {
  panel.querySelector('.lm-close').addEventListener('click', () => {
    panel.classList.remove('is-open');
  });

  panel.querySelector('[data-action="scan"]').addEventListener('click', runScan);
  panel.querySelector('[data-action="start"]').addEventListener('click', startFirstStep);
  panel.querySelector('[data-action="focus"]').addEventListener('click', toggleFocusMode);
  panel.querySelector('[data-action="read"]').addEventListener('click', readPageSummary);
  panel.querySelector('[data-action="copy"]').addEventListener('click', copyHandoff);
  panel.querySelector('[data-action="stop"]').addEventListener('click', stopReading);
  panel.querySelector('[data-action="save-note"]').addEventListener('click', saveMemoryNote);
  panel.querySelector('[data-action="clear-note"]').addEventListener('click', clearMemoryNote);

  panel.addEventListener('change', (event) => {
    if (event.target.matches('.lm-check-input')) {
      updateNextStepFromChecklist();
    }
  });

  panel.addEventListener('click', (event) => {
    const goButton = event.target.closest('[data-go-index]');
    if (!goButton) return;

    const index = Number(goButton.getAttribute('data-go-index'));
    goToChecklistItem(index);
  });
}

function runScan() {
  const model = buildPageModel();
  const items = buildChecklist(model);

  lifeModeState.model = model;
  lifeModeState.items = items;

  renderSummary(model);
  renderChecklist(items);
  updateNextStepFromChecklist();
  setStatus(`Ready. I found ${items.length} useful steps.`);
}

function buildPageModel() {
  const root = getScanRoot();
  const fields = getVisibleFields(root);
  const requiredFields = fields.filter((field) => isRequiredField(field));
  const actions = getPrimaryActions(root);
  const headings = getUsefulHeadings(root);
  const title = getPageTitle(root);
  const intro = getFirstUsefulParagraph(root);

  const pageType = detectPageType({ root, fields, requiredFields, headings, title, intro });

  return {
    root,
    fields,
    requiredFields,
    actions,
    headings,
    title,
    intro,
    pageType,
  };
}

function detectPageType(model) {
  if (model.requiredFields.length > 0 || model.fields.length >= 3 || model.root.matches('form')) {
    return 'Form Rescue';
  }

  if (model.root.matches('article') || model.headings.length >= 3 || model.intro) {
    return 'Reading Mode';
  }

  return 'Page Rescue';
}

function buildChecklist(model) {
  if (model.pageType === 'Form Rescue') {
    return buildFormChecklist(model);
  }

  if (model.pageType === 'Reading Mode') {
    return buildReadingChecklist(model);
  }

  return buildGenericChecklist(model);
}

function buildFormChecklist(model) {
  const items = [];
  const priorityFields = model.requiredFields.length > 0 ? model.requiredFields : model.fields;

  priorityFields.slice(0, 8).forEach((field) => {
    items.push({
      text: `Fill field: ${field.label}`,
      target: field.element,
      kind: 'field',
    });
  });

  if (model.actions.length > 0) {
    items.push({
      text: `When fields are ready, use: ${model.actions[0].label}`,
      target: model.actions[0].element,
      kind: 'action',
    });
  } else {
    items.push({
      text: 'Review the form for anything missing before leaving the page.',
      target: model.root,
      kind: 'review',
    });
  }

  return uniqueChecklist(items);
}

function buildReadingChecklist(model) {
  const items = [];

  if (model.title) {
    items.push({
      text: `Read title: ${model.title}`,
      target: model.titleElement,
      kind: 'title',
    });
  }

  if (model.intro) {
    items.push({
      text: 'Read the short intro under the title.',
      target: model.introElement,
      kind: 'intro',
    });
  }

  model.headings.slice(0, 6).forEach((heading) => {
    if (!sameText(heading.label, model.title)) {
      items.push({
        text: `Review section: ${heading.label}`,
        target: heading.element,
        kind: 'section',
      });
    }
  });

  if (model.actions.length > 0) {
    items.push({
      text: `Optional action: ${model.actions[0].label}`,
      target: model.actions[0].element,
      kind: 'action',
    });
  }

  if (items.length === 0) {
    items.push({ text: 'Read the first visible paragraph.', target: model.root, kind: 'read' });
  }

  return uniqueChecklist(items).slice(0, 10);
}

function buildGenericChecklist(model) {
  const items = [];

  if (model.title) {
    items.push({ text: `Read the page title: ${model.title}`, target: model.titleElement, kind: 'title' });
  }

  model.headings.slice(0, 5).forEach((heading) => {
    items.push({ text: `Review section: ${heading.label}`, target: heading.element, kind: 'section' });
  });

  model.actions.slice(0, 3).forEach((action) => {
    items.push({ text: `Look for action: ${action.label}`, target: action.element, kind: 'action' });
  });

  if (items.length === 0) {
    items.push(
      { text: 'Read the page title.', target: document.body, kind: 'read' },
      { text: 'Find the first form, button, or instruction.', target: document.body, kind: 'find' },
      { text: 'Do only the next visible step.', target: document.body, kind: 'next' }
    );
  }

  return uniqueChecklist(items).slice(0, 10);
}

function uniqueChecklist(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = cleanText(item.text).toLowerCase();
    if (!key || seen.has(key) || isNoiseText(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderSummary(model) {
  const typeEl = document.getElementById('lm-page-type');
  const summaryEl = document.getElementById('lm-summary');

  if (!typeEl || !summaryEl) return;

  typeEl.textContent = model.pageType;

  if (model.pageType === 'Form Rescue') {
    const fieldCount = model.requiredFields.length || model.fields.length;
    summaryEl.textContent = `I found ${fieldCount} field${fieldCount === 1 ? '' : 's'}. We will handle them one at a time.`;
    return;
  }

  if (model.pageType === 'Reading Mode') {
    summaryEl.textContent = model.intro || 'I found the main reading area. Start with the title, then move through the sections.';
    return;
  }

  summaryEl.textContent = 'I found a page structure. Start with the first useful item, then decide the next action.';
}

function renderChecklist(items) {
  const list = document.getElementById('lm-checklist');
  if (!list) return;

  list.innerHTML = '';

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'lm-check-row';

    const label = document.createElement('label');
    label.className = 'lm-check-label';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'lm-check-input';
    input.setAttribute('data-index', String(index));

    const text = document.createElement('span');
    text.textContent = item.text;

    label.append(input, text);

    const goButton = document.createElement('button');
    goButton.type = 'button';
    goButton.className = 'lm-go-button';
    goButton.textContent = 'Go';
    goButton.setAttribute('data-go-index', String(index));

    li.append(label, goButton);
    list.appendChild(li);
  });
}

function updateNextStepFromChecklist() {
  const nextStep = document.getElementById('lm-next-step');
  const boxes = Array.from(document.querySelectorAll('.lm-check-input'));
  if (!nextStep) return;

  const nextBox = boxes.find((box) => !box.checked);

  if (!nextBox) {
    nextStep.textContent = 'You completed this checklist. Pause, breathe, and decide if anything else is needed.';
    clearTargetHighlight();
    return;
  }

  const index = Number(nextBox.getAttribute('data-index'));
  const item = lifeModeState.items[index];
  nextStep.textContent = item?.text || 'Take one small step on this page.';
}

function startFirstStep() {
  const boxes = Array.from(document.querySelectorAll('.lm-check-input'));
  const nextBox = boxes.find((box) => !box.checked);
  const index = nextBox ? Number(nextBox.getAttribute('data-index')) : 0;
  goToChecklistItem(index);
}

function goToChecklistItem(index) {
  const item = lifeModeState.items[index];
  if (!item || !item.target) {
    setStatus('No page target found for that step.');
    return;
  }

  highlightElement(item.target);
  item.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

  if (isFocusable(item.target)) {
    setTimeout(() => item.target.focus({ preventScroll: true }), 250);
  }

  setStatus('I highlighted the step on the page.');
}

function highlightElement(element) {
  clearTargetHighlight();
  lifeModeState.highlightedElement = element;
  element.classList.add(TARGET_CLASS);
}

function clearTargetHighlight() {
  if (lifeModeState.highlightedElement) {
    lifeModeState.highlightedElement.classList.remove(TARGET_CLASS);
  }
  lifeModeState.highlightedElement = null;
}

function toggleFocusMode() {
  document.documentElement.classList.toggle(FOCUS_CLASS);
  const enabled = document.documentElement.classList.contains(FOCUS_CLASS);
  chrome.storage.local.set({ focusMode: enabled });
  setStatus(enabled ? 'Focus mode is on.' : 'Focus mode is off.');
}

function getScanRoot() {
  const candidates = Array.from(document.querySelectorAll([
    'form',
    'main',
    'article',
    '[role="main"]',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.content',
    '#content',
  ].join(','))).filter((el) => isUsableElement(el) && !isIgnoredElement(el));

  if (candidates.length === 0) return document.body;

  return candidates
    .map((el) => ({ element: el, score: scoreScanRoot(el) }))
    .sort((a, b) => b.score - a.score)[0].element;
}

function scoreScanRoot(el) {
  const textLength = normalizeText(el.innerText || el.textContent).length;
  const fields = el.querySelectorAll('input, select, textarea').length;
  const requiredFields = Array.from(el.querySelectorAll('input, select, textarea')).filter((field) => isRequiredField(field)).length;
  const headings = el.querySelectorAll('h1, h2, h3').length;
  const isForm = el.matches('form') ? 2200 : 0;
  const isArticle = el.matches('article, main, [role="main"]') ? 900 : 0;

  return textLength + fields * 120 + requiredFields * 600 + headings * 90 + isForm + isArticle;
}

function getVisibleFields(root) {
  return Array.from(root.querySelectorAll('input, select, textarea'))
    .filter((field) => isUsableElement(field) && !isIgnoredElement(field))
    .filter((field) => !field.disabled && field.type !== 'hidden')
    .map((field) => ({ element: field, label: getFieldLabel(field) }))
    .filter((field) => field.label && !isNoiseFieldLabel(field.label));
}

function isRequiredField(field) {
  if (!isUsableElement(field)) return false;
  if (isIgnoredElement(field)) return false;
  if (field.disabled || field.type === 'hidden') return false;

  const required = field.required || field.getAttribute('aria-required') === 'true';
  if (!required) return false;

  return !isNoiseFieldLabel(getFieldLabel(field));
}

function getFieldLabel(field) {
  if (field.id) {
    const label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (label && isUsableElement(label)) return stripRequiredMarker(cleanText(label.textContent));
  }

  const labelledBy = field.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelText = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || '')
      .join(' ');
    if (labelText) return stripRequiredMarker(cleanText(labelText));
  }

  const wrappedLabel = field.closest('label');
  if (wrappedLabel && isUsableElement(wrappedLabel)) {
    return stripRequiredMarker(cleanText(wrappedLabel.textContent));
  }

  return stripRequiredMarker(cleanText(
    field.getAttribute('aria-label') ||
    field.getAttribute('placeholder') ||
    field.name ||
    field.id ||
    'field'
  ));
}

function getUsefulHeadings(root) {
  return Array.from(root.querySelectorAll('h1, h2, h3'))
    .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
    .map((el) => ({ element: el, label: cleanText(el.textContent) }))
    .filter((heading) => heading.label && heading.label.length > 8 && !isNoiseText(heading.label))
    .slice(0, 12);
}

function getPrimaryActions(root) {
  return Array.from(root.querySelectorAll('button, input[type="submit"], input[type="button"], a[href]'))
    .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
    .map((el) => ({
      element: el,
      label: cleanText(el.innerText || el.value || el.getAttribute('aria-label') || el.textContent),
    }))
    .filter((action) => isActionText(action.label) && !isNoiseText(action.label))
    .slice(0, 8);
}

function getPageTitle(root) {
  const titleElement = root.querySelector('h1') || document.querySelector('h1');
  const title = titleElement ? cleanText(titleElement.textContent) : cleanText(document.title);

  if (!title || isNoiseText(title)) return '';

  lifeModeState.modelTitleElement = titleElement || document.body;
  return title;
}

function getFirstUsefulParagraph(root) {
  const paragraph = Array.from(root.querySelectorAll('p'))
    .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
    .map((el) => ({ element: el, text: cleanText(el.textContent, 260) }))
    .find((item) => item.text.length > 40 && !isNoiseText(item.text));

  if (!paragraph) return '';

  lifeModeState.modelIntroElement = paragraph.element;
  return paragraph.text;
}

function isUsableElement(el) {
  if (!el || !(el instanceof Element)) return false;
  if (el.id === LIFEMODE_PANEL_ID || el.closest(`#${LIFEMODE_PANEL_ID}`)) return false;

  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;

  return true;
}

function isIgnoredElement(el) {
  if (!el || !(el instanceof Element)) return true;
  if (el.id === LIFEMODE_PANEL_ID || el.closest(`#${LIFEMODE_PANEL_ID}`)) return true;

  const ignoredAncestor = el.closest([
    'script',
    'style',
    'noscript',
    'template',
    'header',
    'footer',
    'nav',
    '[role="banner"]',
    '[role="navigation"]',
    '[role="contentinfo"]',
    '[aria-hidden="true"]',
  ].join(','));

  if (ignoredAncestor) return true;

  const identity = [
    el.id,
    typeof el.className === 'string' ? el.className : '',
    el.getAttribute('role'),
    el.getAttribute('aria-label'),
    el.getAttribute('name'),
  ].join(' ').toLowerCase();

  return isNoiseIdentity(identity);
}

function isNoiseIdentity(value) {
  if (!value) return false;

  return [
    'advert',
    'advertisement',
    'sponsor',
    'newsletter',
    'subscribe',
    'cookie',
    'consent',
    'gdpr',
    'privacy-banner',
    'share',
    'social',
    'related-post',
    'related_content',
    'promo',
    'modal',
    'popup',
    'overlay',
  ].some((word) => value.includes(word)) || /(^|[\s_-])ad(s|vert)?($|[\s_-])/.test(value);
}

function isNoiseFieldLabel(text) {
  const value = cleanText(text).toLowerCase();

  return [
    'plays sound',
    'contains adult content',
    'covers the page',
    'report this ad',
    'why this ad',
    'other',
    'close',
  ].includes(value) || value.includes('report ad');
}

function isNoiseText(text) {
  const value = cleanText(text).toLowerCase();
  if (!value) return true;

  return [
    'cookie notice',
    'accept cookies',
    'cookie settings',
    'privacy policy',
    'terms of use',
    'advertisement',
    'sponsored',
    'report ad',
    'subscribe',
    'newsletter',
    'share this',
    'related stories',
    'see more',
    'all bookmarks',
  ].some((phrase) => value.includes(phrase));
}

function readPageSummary() {
  const nextStep = document.getElementById('lm-next-step')?.textContent || '';
  const summary = document.getElementById('lm-summary')?.textContent || '';
  const items = getChecklistText();
  const text = `LifeMode. ${summary}. Next step. ${nextStep}. Checklist. ${items}`;

  if (!('speechSynthesis' in window)) {
    setStatus('Read aloud is not available in this browser.');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
  setStatus('Reading aloud.');
}

function stopReading() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  setStatus('Reading stopped.');
}

async function copyHandoff() {
  const title = lifeModeState.model?.title || document.title || 'Current page';
  const summary = document.getElementById('lm-summary')?.textContent || '';
  const nextStep = document.getElementById('lm-next-step')?.textContent || '';
  const checklist = getChecklistText();
  const note = document.getElementById('lm-note')?.value.trim() || '';

  const text = [
    `LifeMode handoff: ${title}`,
    '',
    `Summary: ${summary}`,
    `Next step: ${nextStep}`,
    '',
    'Checklist:',
    checklist,
    note ? `\nMemory note: ${note}` : '',
    `\nPage: ${location.href}`,
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
    setStatus('Handoff copied.');
  } catch (error) {
    setStatus('Could not copy handoff.');
  }
}

function getChecklistText() {
  return lifeModeState.items
    .map((item, index) => `${index + 1}. ${item.text}`)
    .join('\n');
}

function prepareMemoryNote() {
  lifeModeState.noteKey = `lifemode-note:${location.origin}${location.pathname}`;

  chrome.storage.local.get([lifeModeState.noteKey]).then((result) => {
    const noteEl = document.getElementById('lm-note');
    if (noteEl && result[lifeModeState.noteKey]) {
      noteEl.value = result[lifeModeState.noteKey];
    }
  });
}

function saveMemoryNote() {
  const noteEl = document.getElementById('lm-note');
  if (!noteEl) return;

  chrome.storage.local.set({ [lifeModeState.noteKey]: noteEl.value.trim() });
  setStatus('Memory note saved in this browser.');
}

function clearMemoryNote() {
  const noteEl = document.getElementById('lm-note');
  if (noteEl) noteEl.value = '';

  chrome.storage.local.remove(lifeModeState.noteKey);
  setStatus('Memory note cleared.');
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanText(value, maxLength = 160) {
  return normalizeText(value).slice(0, maxLength);
}

function stripRequiredMarker(value) {
  return cleanText(value).replace(/[\s*]+$/, '');
}

function sameText(a, b) {
  return cleanText(a).toLowerCase() === cleanText(b).toLowerCase();
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
    'accept',
  ].some((word) => value.includes(word));
}

function isFocusable(el) {
  return el.matches('input, select, textarea, button, a[href], [tabindex]');
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
