(() => {
  const PANEL_ID = 'gsb-lifemode-panel';
  const TARGET_CLASS = 'gsb-lifemode-target';
  const upgradeState = {
    items: [],
    model: null,
    highlighted: null,
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'OPEN_LIFEMODE') {
      setTimeout(applyLifeModeUpgrade, 120);
    }
  });

  document.addEventListener('click', (event) => {
    const panel = document.getElementById(PANEL_ID);
    if (!panel || !panel.contains(event.target)) return;

    const actionButton = event.target.closest('[data-action]');
    const goButton = event.target.closest('[data-go-index]');

    if (goButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      goToItem(Number(goButton.getAttribute('data-go-index')));
      return;
    }

    if (!actionButton) return;
    const action = actionButton.getAttribute('data-action');

    if (['scan', 'start', 'copy', 'read'].includes(action)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    if (action === 'scan') applyLifeModeUpgrade();
    if (action === 'start') startFirstOpenItem();
    if (action === 'copy') copyUpgradedHandoff();
    if (action === 'read') readUpgradedSummary();
  }, true);

  document.addEventListener('change', (event) => {
    if (!event.target.matches(`#${PANEL_ID} .lm-check-input`)) return;
    event.stopPropagation();
    updateNextStep();
  }, true);

  function applyLifeModeUpgrade() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const model = buildModel();
    const items = buildItems(model);
    upgradeState.model = model;
    upgradeState.items = items;

    const badge = document.getElementById('lm-page-type');
    const summary = document.getElementById('lm-summary');
    if (badge) badge.textContent = model.type;
    if (summary) summary.textContent = model.summary;

    renderItems(items);
    updateNextStep();
    setStatus(`Ready. I found ${items.length} useful steps.`);
  }

  function buildModel() {
    const root = bestRoot();
    const title = titleInfo(root);
    const intro = introInfo(root);
    const fields = fieldsInfo(root);
    const requiredFields = fields.filter((field) => field.element.required || field.element.getAttribute('aria-required') === 'true');
    const tasks = taskLinks(root);
    const headings = headingsInfo(root);

    const model = { root, title, intro, fields, requiredFields, tasks, headings, type: 'Page Rescue', summary: '' };

    if (requiredFields.length || fields.length >= 3 || root.matches('form')) {
      model.type = 'Form Rescue';
      const count = requiredFields.length || fields.length;
      model.summary = `I found ${count} field${count === 1 ? '' : 's'}. We will handle them one at a time.`;
      return model;
    }

    if (looksLikePortal(model)) {
      model.type = 'Task Portal';
      model.summary = `I found ${tasks.length} useful task link${tasks.length === 1 ? '' : 's'}. Pick the one closest to what you came here to do.`;
      return model;
    }

    if (root.matches('article') || intro.text || headings.length >= 3) {
      model.type = 'Reading Mode';
      model.summary = intro.text || 'I found the main reading area. Start with the title, then move through the sections.';
      return model;
    }

    model.summary = 'I found a page structure. Start with the first useful item, then decide the next action.';
    return model;
  }

  function looksLikePortal(model) {
    const text = clean(model.root.innerText || model.root.textContent, 1200).toLowerCase();
    const words = ['top pages', 'find a', 'create account', 'sign in', 'manage', 'claim', 'benefits', 'appointments', 'download', 'portal'];
    return model.tasks.length >= 5 || words.filter((word) => text.includes(word)).length >= 3;
  }

  function buildItems(model) {
    if (model.type === 'Form Rescue') return formItems(model);
    if (model.type === 'Task Portal') return portalItems(model);
    if (model.type === 'Reading Mode') return readingItems(model);
    return genericItems(model);
  }

  function formItems(model) {
    const source = model.requiredFields.length ? model.requiredFields : model.fields;
    const items = source.slice(0, 8).map((field) => ({ text: `Fill field: ${field.label}`, target: field.element }));
    const action = model.tasks[0];
    items.push(action ? { text: `When ready, use: ${action.label}`, target: action.element } : { text: 'Review the form for anything missing.', target: model.root });
    return unique(items).slice(0, 10);
  }

  function portalItems(model) {
    const items = [];
    if (model.title.text) items.push({ text: `Start here: ${model.title.text}`, target: model.title.element || model.root });
    model.tasks.slice(0, 8).forEach((task, index) => {
      items.push({ text: index === 0 ? `Choose task: ${task.label}` : `Option: ${task.label}`, target: task.element });
    });
    if (!items.length) items.push({ text: 'Pick the closest task link on this page.', target: model.root });
    return unique(items).slice(0, 10);
  }

  function readingItems(model) {
    const items = [];
    if (model.title.text) items.push({ text: `Read title: ${model.title.text}`, target: model.title.element || model.root });
    if (model.intro.text) items.push({ text: 'Read the short intro under the title.', target: model.intro.element || model.title.element || model.root });
    model.headings.slice(0, 6).forEach((heading) => {
      if (!same(heading.label, model.title.text)) items.push({ text: `Review section: ${heading.label}`, target: heading.element });
    });
    const action = model.tasks.find((task) => actionText(task.label));
    if (action) items.push({ text: `Optional action: ${action.label}`, target: action.element });
    if (!items.length) items.push({ text: 'Read the first visible paragraph.', target: model.root });
    return unique(items).slice(0, 10);
  }

  function genericItems(model) {
    const items = [];
    if (model.title.text) items.push({ text: `Read the page title: ${model.title.text}`, target: model.title.element || model.root });
    model.headings.slice(0, 5).forEach((heading) => items.push({ text: `Review section: ${heading.label}`, target: heading.element }));
    model.tasks.slice(0, 3).forEach((task) => items.push({ text: `Look for action: ${task.label}`, target: task.element }));
    if (!items.length) items.push({ text: 'Read the page title.', target: document.body }, { text: 'Find the first form, button, or instruction.', target: document.body }, { text: 'Do only the next visible step.', target: document.body });
    return unique(items).slice(0, 10);
  }

  function renderItems(items) {
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

      const go = document.createElement('button');
      go.type = 'button';
      go.className = 'lm-go-button';
      go.textContent = 'Go';
      go.setAttribute('data-go-index', String(index));

      li.append(label, go);
      list.appendChild(li);
    });
  }

  function updateNextStep() {
    const next = document.getElementById('lm-next-step');
    const boxes = Array.from(document.querySelectorAll(`#${PANEL_ID} .lm-check-input`));
    if (!next) return;
    const box = boxes.find((item) => !item.checked);
    if (!box) {
      next.textContent = 'You completed this checklist. Pause, breathe, and decide if anything else is needed.';
      clearHighlight();
      return;
    }
    const index = Number(box.getAttribute('data-index'));
    next.textContent = upgradeState.items[index]?.text || 'Take one small step on this page.';
  }

  function startFirstOpenItem() {
    const box = Array.from(document.querySelectorAll(`#${PANEL_ID} .lm-check-input`)).find((item) => !item.checked);
    goToItem(box ? Number(box.getAttribute('data-index')) : 0);
  }

  function goToItem(index) {
    const item = upgradeState.items[index];
    const target = item?.target || findElementForText(item?.text || '');
    if (!target) {
      setStatus('No page target found for that step.');
      return;
    }
    highlight(target);
    target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    if (target.matches('input, select, textarea, button, a[href], [tabindex]')) setTimeout(() => target.focus({ preventScroll: true }), 250);
    setStatus('I highlighted the step on the page.');
  }

  async function copyUpgradedHandoff() {
    const note = document.getElementById('lm-note')?.value.trim() || '';
    const text = [`LifeMode handoff: ${upgradeState.model?.title.text || document.title || 'Current page'}`, '', `Summary: ${upgradeState.model?.summary || ''}`, `Next step: ${document.getElementById('lm-next-step')?.textContent || ''}`, '', 'Checklist:', checklistText(), note ? `\nMemory note: ${note}` : '', `\nPage: ${location.href}`].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Handoff copied.');
    } catch (error) {
      setStatus('Could not copy handoff.');
    }
  }

  function readUpgradedSummary() {
    if (!('speechSynthesis' in window)) {
      setStatus('Read aloud is not available in this browser.');
      return;
    }
    const text = `LifeMode. ${upgradeState.model?.summary || ''}. Next step. ${document.getElementById('lm-next-step')?.textContent || ''}. Checklist. ${checklistText()}`;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setStatus('Reading aloud.');
  }

  function checklistText() {
    return upgradeState.items.map((item, index) => `${index + 1}. ${item.text}`).join('\n');
  }

  function bestRoot() {
    const selectors = ['form', 'main', 'article', '[role="main"]', '.entry-content', '.post-content', '.article-content', '.content', '#content'];
    const candidates = Array.from(document.querySelectorAll(selectors.join(','))).filter((el) => usable(el) && !ignored(el));
    if (!candidates.length) return document.body;
    return candidates.map((el) => ({ el, score: rootScore(el) })).sort((a, b) => b.score - a.score)[0].el;
  }

  function rootScore(el) {
    return clean(el.innerText || el.textContent, 5000).length + el.querySelectorAll('input, select, textarea').length * 160 + taskLinks(el).length * 180 + el.querySelectorAll('h1, h2, h3').length * 80 + (el.matches('form') ? 2200 : 0) + (el.matches('main, article, [role="main"]') ? 900 : 0);
  }

  function titleInfo(root) {
    const element = root.querySelector('h1') || document.querySelector('h1');
    const text = element ? clean(element.textContent) : clean(document.title);
    return text && !noiseText(text) ? { text, element } : { text: '', element: root };
  }

  function introInfo(root) {
    return Array.from(root.querySelectorAll('p')).filter((el) => usable(el) && !ignored(el)).map((element) => ({ element, text: clean(element.textContent, 260) })).find((item) => item.text.length > 40 && !noiseText(item.text)) || { text: '', element: root };
  }

  function headingsInfo(root) {
    return Array.from(root.querySelectorAll('h1, h2, h3')).filter((el) => usable(el) && !ignored(el)).map((element) => ({ element, label: clean(element.textContent) })).filter((item) => item.label.length > 8 && !noiseText(item.label)).slice(0, 12);
  }

  function fieldsInfo(root) {
    return Array.from(root.querySelectorAll('input, select, textarea')).filter((el) => usable(el) && !ignored(el) && !el.disabled && el.type !== 'hidden').map((element) => ({ element, label: fieldLabel(element) })).filter((item) => item.label && !noiseField(item.label));
  }

  function fieldLabel(field) {
    if (field.id) {
      const label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
      if (label && usable(label)) return strip(clean(label.textContent));
    }
    const wrapped = field.closest('label');
    if (wrapped && usable(wrapped)) return strip(clean(wrapped.textContent));
    return strip(clean(field.getAttribute('aria-label') || field.getAttribute('placeholder') || field.name || field.id || 'field'));
  }

  function taskLinks(root) {
    const seen = new Set();
    return Array.from(root.querySelectorAll('a[href], button, input[type="submit"], input[type="button"]'))
      .filter((el) => usable(el) && !ignored(el))
      .map((element) => ({ element, label: clean(element.innerText || element.value || element.getAttribute('aria-label') || element.textContent), href: element.getAttribute('href') || '', tag: element.tagName.toLowerCase() }))
      .filter((item) => item.label.length >= 4 && item.label.length <= 95 && !noiseText(item.label) && !noiseIdentity(item.label.toLowerCase()))
      .filter((item) => {
        const key = item.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((item) => ({ ...item, score: taskScore(item) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }

  function taskScore(item) {
    const text = item.label.toLowerCase();
    let score = item.tag === 'a' ? 2 : 1;
    ['check', 'find', 'manage', 'create', 'learn', 'view', 'verify', 'file', 'download', 'apply', 'start', 'get started', 'claim', 'benefit', 'appointment', 'health', 'form', 'location', 'sign in'].forEach((word) => {
      if (text.includes(word)) score += 3;
    });
    if (item.href && item.href !== '#') score += 1;
    if (text.length > 65) score -= 1;
    return score;
  }

  function usable(el) {
    if (!el || !(el instanceof Element)) return false;
    if (el.id === PANEL_ID || el.closest(`#${PANEL_ID}`)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width >= 2 && rect.height >= 2;
  }

  function ignored(el) {
    if (!el || !(el instanceof Element)) return true;
    if (el.id === PANEL_ID || el.closest(`#${PANEL_ID}`)) return true;
    if (el.closest('script, style, noscript, template, header, footer, nav, [role="banner"], [role="navigation"], [role="contentinfo"], [aria-hidden="true"]')) return true;
    const identity = [el.id, typeof el.className === 'string' ? el.className : '', el.getAttribute('role'), el.getAttribute('aria-label'), el.getAttribute('name')].join(' ').toLowerCase();
    return noiseIdentity(identity);
  }

  function noiseIdentity(value) {
    if (!value) return false;
    return ['advert', 'advertisement', 'sponsor', 'newsletter', 'subscribe', 'cookie', 'consent', 'gdpr', 'privacy-banner', 'share', 'social', 'related-post', 'related_content', 'promo', 'modal', 'popup', 'overlay'].some((word) => value.includes(word)) || /(^|[\s_-])ad(s|vert)?($|[\s_-])/.test(value);
  }

  function noiseField(text) {
    const value = clean(text).toLowerCase();
    return ['plays sound', 'contains adult content', 'covers the page', 'report this ad', 'why this ad', 'other', 'close'].includes(value) || value.includes('report ad');
  }

  function noiseText(text) {
    const value = clean(text).toLowerCase();
    if (!value) return true;
    return ['cookie notice', 'accept cookies', 'cookie settings', 'privacy policy', 'terms of use', 'advertisement', 'sponsored', 'report ad', 'subscribe', 'newsletter', 'share this', 'related stories', 'see more', 'all bookmarks', 'official website of the united states government'].some((phrase) => value.includes(phrase));
  }

  function findElementForText(text) {
    const needle = clean(text).replace(/^(read title|start here|read the page title|review section|choose task|option|look for action):\s*/i, '').toLowerCase();
    if (!needle) return null;
    return Array.from(document.querySelectorAll('h1, h2, h3, p, a, button, label')).filter((el) => usable(el) && !ignored(el)).find((el) => clean(el.textContent).toLowerCase().includes(needle));
  }

  function highlight(element) {
    clearHighlight();
    upgradeState.highlighted = element;
    element.classList.add(TARGET_CLASS);
  }

  function clearHighlight() {
    if (upgradeState.highlighted) upgradeState.highlighted.classList.remove(TARGET_CLASS);
    upgradeState.highlighted = null;
  }

  function unique(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = clean(item.text).toLowerCase();
      if (!key || seen.has(key) || noiseText(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function actionText(text) {
    const value = clean(text).toLowerCase();
    return Boolean(value && ['submit', 'continue', 'next', 'save', 'apply', 'send', 'upload', 'download', 'sign in', 'log in', 'start', 'finish', 'review', 'accept', 'check', 'find', 'manage', 'create', 'learn', 'view', 'verify', 'file'].some((word) => value.includes(word)));
  }

  function strip(value) {
    return clean(value).replace(/[\s*]+$/, '');
  }

  function same(a, b) {
    return clean(a).toLowerCase() === clean(b).toLowerCase();
  }

  function clean(value, maxLength = 160) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setStatus(message) {
    const status = document.getElementById('lm-status');
    if (status) status.textContent = message;
  }
})();
