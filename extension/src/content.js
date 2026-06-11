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
  const root = getScanRoot();
  const items = [];
  const requiredFields = getRequiredFields(root);
  const primaryActions = getPrimaryActions(root);
  const headings = getUsefulHeadings(root);
  const pageTitle = getPageTitle(root);

  if (requiredFields.length > 0) {
    requiredFields.slice(0, 6).forEach((label) => {
      items.push(`Fill required field: ${label}`);
    });

    if (primaryActions.length > 0) {
      items.push(`When ready, look for: ${primaryActions[0]}`);
    }
  } else {
    if (pageTitle) {
      items.push(`Read the page title: ${pageTitle}`);
    }

    const intro = getFirstUsefulParagraph(root);
    if (intro) {
      items.push('Read the short intro under the title.');
    }

    headings.slice(0, 6).forEach((heading) => {
      if (!sameText(heading, pageTitle)) {
        items.push(`Review section: ${heading}`);
      }
    });

    if (primaryActions.length > 0) {
      items.push(`Look for action: ${primaryActions[0]}`);
    }
  }

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
  const textLength = cleanText(el.innerText || el.textContent).length;
  const fields = el.querySelectorAll('input, select, textarea').length;
  const requiredFields = getRequiredFields(el).length;
  const headings = el.querySelectorAll('h1, h2, h3').length;
  const isForm = el.matches('form') ? 2000 : 0;
  const isArticle = el.matches('article, main, [role="main"]') ? 800 : 0;

  return textLength + fields * 120 + requiredFields * 500 + headings * 80 + isForm + isArticle;
}

function getRequiredFields(root) {
  return Array.from(root.querySelectorAll('input, select, textarea'))
    .filter((field) => isRequiredField(field))
    .map((field) => getFieldLabel(field))
    .filter((label) => label && !isNoiseText(label))
    .slice(0, 12);
}

function isRequiredField(field) {
  if (!isUsableElement(field)) return false;
  if (isIgnoredElement(field)) return false;
  if (field.disabled) return false;
  if (field.type === 'hidden') return false;

  const required = field.required || field.getAttribute('aria-required') === 'true';
  if (!required) return false;

  const label = getFieldLabel(field);
  if (isNoiseFieldLabel(label)) return false;

  return true;
}

function getFieldLabel(field) {
  if (field.id) {
    const label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (label && isUsableElement(label)) return cleanText(label.textContent).replace(/\*+$/, '');
  }

  const labelledBy = field.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelText = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || '')
      .join(' ');
    if (labelText) return cleanText(labelText).replace(/\*+$/, '');
  }

  const wrappedLabel = field.closest('label');
  if (wrappedLabel && isUsableElement(wrappedLabel)) {
    return cleanText(wrappedLabel.textContent).replace(/\*+$/, '');
  }

  return cleanText(
    field.getAttribute('aria-label') ||
    field.getAttribute('placeholder') ||
    field.name ||
    field.id ||
    'field'
  ).replace(/\*+$/, '');
}

function getUsefulHeadings(root) {
  return Array.from(root.querySelectorAll('h1, h2, h3'))
    .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
    .map((el) => cleanText(el.textContent))
    .filter((text) => text && text.length > 8 && !isNoiseText(text))
    .slice(0, 10);
}

function getPrimaryActions(root) {
  return Array.from(root.querySelectorAll('button, input[type="submit"], input[type="button"], a[href]'))
    .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
    .map((el) => cleanText(el.innerText || el.value || el.getAttribute('aria-label') || el.textContent))
    .filter((text) => isActionText(text) && !isNoiseText(text))
    .slice(0, 8);
}

function getPageTitle(root) {
  const titleFromRoot = root.querySelector('h1');
  const title = titleFromRoot ? cleanText(titleFromRoot.textContent) : cleanText(document.title);

  if (!title || isNoiseText(title)) return '';
  return title;
}

function getFirstUsefulParagraph(root) {
  return Array.from(root.querySelectorAll('p'))
    .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
    .map((el) => cleanText(el.textContent))
    .find((text) => text.length > 40 && !isNoiseText(text));
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
    el.className,
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
    'search',
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
