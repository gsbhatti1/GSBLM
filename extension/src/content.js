(() => {
  if (window.__gsbLifeModeLoaded) {
    window.dispatchEvent(new CustomEvent('GSB_LIFEMODE_OPEN'));
    return;
  }

  window.__gsbLifeModeLoaded = true;

  const LIFEMODE_PANEL_ID = 'gsb-lifemode-panel';
  const FOCUS_CLASS = 'gsb-lifemode-focus';
  const TARGET_CLASS = 'gsb-lifemode-target';
  const LINK_TARGET_CLASS = 'gsb-lifemode-link-target';
  const LINK_BADGE_CLASS = 'gsb-lifemode-link-badge';
  const PANEL_STATE_PREFIX = 'lifemode-panel-open:';

  const lifeModeState = {
    items: [],
    model: null,
    highlightedElement: null,
    badgedElements: [],
    noteKey: '',
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || !message.type) return;

    if (message.type === 'OPEN_LIFEMODE') openLifeModePanel();
    if (message.type === 'TOGGLE_FOCUS_MODE') toggleFocusMode();
  });

  window.addEventListener('GSB_LIFEMODE_OPEN', openLifeModePanel);

  function openLifeModePanel() {
    const existing = document.getElementById(LIFEMODE_PANEL_ID);
    if (existing) {
      existing.classList.add('is-open');
      persistPanelOpen(true);
      runScan();
      return;
    }

    const panel = document.createElement('aside');
    panel.id = LIFEMODE_PANEL_ID;
    panel.className = 'is-open';
    panel.setAttribute('aria-label', 'LifeMode Companion panel');

    panel.innerHTML = `
      <div class="lm-panel-header">
        <div>
          <p class="lm-kicker">GSB LifeMode</p>
          <h2>One clear next step.</h2>
        </div>
        <button type="button" class="lm-close" aria-label="Close LifeMode">x</button>
      </div>

      <p class="lm-intro">LifeMode Companion turns this page into steps, memory, and human help.</p>

      <section class="lm-privacy-note" aria-label="LifeMode privacy note">
        <strong>Private demo mode:</strong> basic page scanning, notes, and checklists stay in this browser. No external AI call is made in this prototype.
      </section>


      <section id="lm-private-va-mode" class="lm-private-va-card" hidden>
        <div class="lm-badge">Private VA Mode</div>
        <p><strong>Safety promise:</strong> LifeMode does not store VA passwords, ID.me login, SSN, or claim numbers. In this prototype, no external AI call is made. You control what you copy or write.</p>
      </section>
      <section id="lm-first-run" class="lm-card lm-welcome-card" aria-label="LifeMode welcome">
        <div class="lm-badge">Welcome</div>
        <h3>Start with one step</h3>
        <p>LifeMode is for the moment when the page is too heavy. Use Steps for the next action, Companion for plain guidance, Memory so you do not lose the thread, and Human Help when software is not enough.</p>
        <button type="button" class="lm-wide-button" data-action="dismiss-welcome">Got it</button>
      </section>

      <div class="lm-tabs" role="tablist" aria-label="LifeMode sections">
        <button type="button" class="lm-tab is-active" data-tab="steps" role="tab" aria-selected="true">Steps</button>
        <button type="button" class="lm-tab" data-tab="companion" role="tab" aria-selected="false">Companion</button>
        <button type="button" class="lm-tab" data-tab="memory" role="tab" aria-selected="false">Memory</button>
        <button type="button" class="lm-tab" data-tab="help" role="tab" aria-selected="false">Human Help</button>
      </div>

      <section class="lm-tab-panel is-active" data-panel="steps" role="tabpanel">
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
      </section>

      <section class="lm-tab-panel" data-panel="companion" role="tabpanel" hidden>
        <section class="lm-card">
          <div class="lm-badge">LifeMode Companion</div>
          <h3>Walk With Me</h3>
          <p class="lm-muted">Type what you need or choose a journey. This is local guided flow only. No external AI call yet.</p>

          <label class="lm-small-label" for="lm-companion-question">Ask Companion</label>
          <textarea id="lm-companion-question" class="lm-companion-question" rows="3" placeholder="Example: I need to apply for VA disability."></textarea>
          <button type="button" class="lm-wide-button" data-action="ask-companion">Ask Companion</button>

          <div class="lm-journey-buttons" aria-label="LifeMode journeys">
            <button type="button" data-journey="va-disability">I need to apply for VA disability</button>
            <button type="button" data-journey="check-claim">I need to check my claim</button>
            <button type="button" data-journey="upload-evidence">I need to upload evidence</button>
            <button type="button" data-journey="write-description">Help write my description</button>
            <button type="button" data-journey="overwhelmed">I am overwhelmed</button>
            <button type="button" data-journey="find-human">Find a real human</button>
          </div>
        </section>

        <section class="lm-card">
          <h3>Quick local tools</h3>
          <p class="lm-muted">These use the current page structure and your memory note.</p>
          <div class="lm-companion-buttons">
            <button type="button" data-companion="explain">Explain this page</button>
            <button type="button" data-companion="missing">Check what I am missing</button>
            <button type="button" data-companion="next">What should I do next?</button>
            <button type="button" data-companion="description">Write a plain description</button>
            <button type="button" data-companion="questions">Questions for a helper</button>
          </div>
        </section>

        <section class="lm-card lm-companion-response" aria-labelledby="lm-companion-title">
          <h3 id="lm-companion-title">Companion response</h3>
          <div id="lm-companion-output">
            <p>Ask one question or choose one journey. Companion will keep it simple: what this means, what may be missing, and the next step.</p>
          </div>
        </section>
      </section>
      <section class="lm-tab-panel" data-panel="memory" role="tabpanel" hidden>
        <section class="lm-card" aria-labelledby="lm-note-title">
          <h3 id="lm-note-title">Memory note</h3>
          <p class="lm-note-help">Write one thing you do not want to forget on this page. Saved only in this browser.</p>
          <textarea id="lm-note" rows="5" placeholder="Example: Come back and upload ID tomorrow."></textarea>
          <div class="lm-note-actions">
            <button type="button" data-action="save-note">Save note</button>
            <button type="button" data-action="clear-note">Clear</button>
          </div>
        </section>

        <section class="lm-card">
          <h3>Handoff</h3>
          <p class="lm-muted">Copy a clean summary for a trusted person, VSO, social worker, caregiver, or future you.</p>
          <button type="button" class="lm-wide-button" data-action="copy-memory">Copy handoff</button>
        </section>
      </section>

      <section class="lm-tab-panel" data-panel="help" role="tabpanel" hidden>
        <section class="lm-card lm-help-card lm-urgent-card">
          <h3>Need help now?</h3>
          <p>If there is immediate danger, call emergency services now. If you might hurt yourself, feel unsafe, or cannot stay alone, reach a real human now.</p>
          <div class="lm-help-grid">
            <a href="tel:988">Call 988</a>
            <a href="sms:988">Text 988</a>
            <a href="https://988lifeline.org/" target="_blank" rel="noopener">988 Lifeline</a>
            <a href="https://www.veteranscrisisline.net/" target="_blank" rel="noopener">Veterans Crisis Line</a>
          </div>
        </section>

        <section class="lm-card lm-help-card">
          <div class="lm-badge">Civilian / Local Help</div>
          <h3>Find local human help</h3>
          <p class="lm-muted">Enter a ZIP code or city. LifeMode does not save your location.</p>
          <label class="lm-small-label" for="lm-help-zip">ZIP code or city</label>
          <input id="lm-help-zip" class="lm-help-input" type="text" inputmode="search" placeholder="Example: 84043 or Lehi, UT">
          <div class="lm-help-grid">
            <button type="button" data-local-search="emergency room">Find ER / hospital</button>
            <button type="button" data-local-search="urgent care">Find urgent care</button>
            <button type="button" data-local-search="community mental health center">Find mental health help</button>
            <button type="button" data-local-search="free clinic">Find free clinic</button>
            <button type="button" data-local-search="food pantry housing assistance">Food / housing help</button>
            <button type="button" data-local-search="211 community resources">Find 211 resources</button>
          </div>
          <button type="button" class="lm-wide-button lm-location-button" data-action="use-location-once">Use my location once for nearest ER</button>
          <p class="lm-note-help">Privacy rule: no background tracking. Location is only requested when you press the button.</p>
        </section>

        <section class="lm-card lm-help-card">
          <div class="lm-badge">Veteran / Military Help</div>
          <h3>Veteran task help</h3>
          <div class="lm-help-grid">
            <a href="tel:988">Call 988, then Press 1</a>
            <a href="sms:838255">Text 838255</a>
            <a href="https://www.va.gov/get-help-from-accredited-representative/" target="_blank" rel="noopener">Find VSO / accredited rep</a>
            <a href="https://www.socialwork.va.gov/" target="_blank" rel="noopener">VA Social Work</a>
            <a href="https://www.va.gov/find-locations/" target="_blank" rel="noopener">Find VA location</a>
            <a href="https://www.woundedwarriorproject.org/" target="_blank" rel="noopener">Wounded Warrior Project</a>
          </div>
        </section>

        <section class="lm-card lm-help-card">
          <div class="lm-badge">Treatment / Support</div>
          <h3>More support paths</h3>
          <div class="lm-help-grid">
            <a href="https://www.211.org/" target="_blank" rel="noopener">211 community help</a>
            <a href="https://www.samhsa.gov/find-help" target="_blank" rel="noopener">SAMHSA Find Help</a>
            <a href="https://findtreatment.gov/" target="_blank" rel="noopener">Find treatment</a>
            <a href="https://www.findhelp.org/" target="_blank" rel="noopener">Find local services</a>
          </div>
        </section>

        <section class="lm-card">
          <h3>Trusted person message</h3>
          <p class="lm-muted">Use this when you need a human to understand where you are stuck.</p>
          <button type="button" class="lm-wide-button" data-action="copy-trusted">Copy message to trusted person</button>
        </section>
      </section>

      <p id="lm-status" class="lm-status" role="status" aria-live="polite"></p>
    `;

    document.documentElement.appendChild(panel);
    bindPanelActions(panel);
    prepareMemoryNote();
    persistPanelOpen(true);
    runScan();
  }

  function bindPanelActions(panel) {
    panel.querySelector('.lm-close').addEventListener('click', () => {
      panel.classList.remove('is-open');
      persistPanelOpen(false);
    });

    panel.querySelectorAll('.lm-tab').forEach((button) => {
      button.addEventListener('click', () => activateTab(button.getAttribute('data-tab')));
    });

    panel.querySelector('[data-action="scan"]').addEventListener('click', runScan);
    panel.querySelector('[data-action="start"]').addEventListener('click', startFirstStep);
    panel.querySelector('[data-action="focus"]').addEventListener('click', toggleFocusMode);
    panel.querySelector('[data-action="read"]').addEventListener('click', readPageSummary);
    panel.querySelector('[data-action="copy"]').addEventListener('click', copyHandoff);
    panel.querySelector('[data-action="copy-memory"]').addEventListener('click', copyHandoff);
    panel.querySelector('[data-action="copy-trusted"]').addEventListener('click', copyTrustedMessage);
    panel.querySelector('[data-action="dismiss-welcome"]')?.addEventListener('click', dismissWelcomeCard);
    panel.querySelectorAll('[data-local-search]').forEach((button) => {
      button.addEventListener('click', () => openLocalHelpSearch(button.getAttribute('data-local-search')));
    });
    panel.querySelector('[data-action="use-location-once"]')?.addEventListener('click', openEmergencySearchWithLocation);
    panel.querySelector('[data-action="stop"]').addEventListener('click', stopReading);
    panel.querySelector('[data-action="save-note"]').addEventListener('click', saveMemoryNote);
    panel.querySelector('[data-action="clear-note"]').addEventListener('click', clearMemoryNote);

    panel.querySelectorAll('[data-companion]').forEach((button) => {
      button.addEventListener('click', () => handleCompanion(button.getAttribute('data-companion')));
    });

    panel.addEventListener('change', (event) => {
      if (event.target.matches('.lm-check-input')) updateNextStepFromChecklist();
    });

    panel.addEventListener('click', (event) => {
      const goButton = event.target.closest('[data-go-index]');
      if (!goButton) return;

      goToChecklistItem(Number(goButton.getAttribute('data-go-index')));
    });
  }

  function activateTab(name) {
    document.querySelectorAll(`#${LIFEMODE_PANEL_ID} .lm-tab`).forEach((button) => {
      const active = button.getAttribute('data-tab') === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    document.querySelectorAll(`#${LIFEMODE_PANEL_ID} .lm-tab-panel`).forEach((panel) => {
      const active = panel.getAttribute('data-panel') === name;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  }

  function runScan() {
    clearLinkBadges();
    const model = buildPageModel();
    const items = buildChecklist(model);

    lifeModeState.model = model;
    lifeModeState.items = items;

    renderSummary(model);
    updatePrivateVaModeBanner();
    renderChecklist(items);
    updateNextStepFromChecklist();
    addTaskLinkBadges(model);
    setStatus(`Ready. I found ${items.length} useful steps.`);
  }

  function buildPageModel() {
    const root = getScanRoot();
    const fields = getVisibleFields(root);
    const requiredFields = fields.filter((field) => isRequiredField(field.element));
    const actions = getPrimaryActions(root);
    const headings = getUsefulHeadings(root);
    const taskLinks = getTaskLinks(root);
    const titleInfo = getPageTitleInfo(root);
    const introInfo = getFirstUsefulParagraphInfo(root);

    const pageType = detectPageType({
      root,
      fields,
      requiredFields,
      actions,
      headings,
      taskLinks,
      title: titleInfo.text,
      intro: introInfo.text,
    });

    return {
      root,
      fields,
      requiredFields,
      actions,
      headings,
      taskLinks,
      title: titleInfo.text,
      titleElement: titleInfo.element,
      intro: introInfo.text,
      introElement: introInfo.element,
      pageType,
    };
  }

  function detectPageType(model) {
    if (model.requiredFields.length > 0 || model.fields.length >= 3 || model.root.matches('form')) return 'Form Rescue';
    if (model.taskLinks.length >= 4) return 'Task Portal';
    if (model.root.matches('article') || model.headings.length >= 3 || model.intro) return 'Reading Mode';
    return 'Page Rescue';
  }

  function buildChecklist(model) {
    if (model.pageType === 'Form Rescue') return buildFormChecklist(model);
    if (model.pageType === 'Task Portal') return buildTaskPortalChecklist(model);
    if (model.pageType === 'Reading Mode') return buildReadingChecklist(model);
    return buildGenericChecklist(model);
  }

  function buildFormChecklist(model) {
    const items = [];
    const priorityFields = model.requiredFields.length > 0 ? model.requiredFields : model.fields;

    priorityFields.slice(0, 8).forEach((field) => {
      items.push({ text: `Fill field: ${field.label}`, target: field.element, kind: 'field' });
    });

    if (model.actions.length > 0) {
      items.push({ text: `When fields are ready, use: ${model.actions[0].label}`, target: model.actions[0].element, kind: 'action' });
    } else {
      items.push({ text: 'Review the form for anything missing before leaving the page.', target: model.root, kind: 'review' });
    }

    return uniqueChecklist(items);
  }

  function buildTaskPortalChecklist(model) {
    const items = [];

    if (model.title) items.push({ text: `Read title: ${model.title}`, target: model.titleElement, kind: 'title' });
    if (model.intro) items.push({ text: 'Read the short intro under the title.', target: model.introElement, kind: 'intro' });

    model.taskLinks.slice(0, 8).forEach((task, index) => {
      items.push({ text: `Choose task ${index + 1}: ${task.label}`, target: task.element, kind: 'task' });
    });

    if (model.actions.length > 0) {
      items.push({ text: `Optional action: ${model.actions[0].label}`, target: model.actions[0].element, kind: 'action' });
    }

    return uniqueChecklist(items).slice(0, 10);
  }

  function buildReadingChecklist(model) {
    const items = [];

    if (model.title) items.push({ text: `Read title: ${model.title}`, target: model.titleElement, kind: 'title' });
    if (model.intro) items.push({ text: 'Read the short intro under the title.', target: model.introElement, kind: 'intro' });

    model.headings.slice(0, 6).forEach((heading) => {
      if (!sameText(heading.label, model.title)) items.push({ text: `Review section: ${heading.label}`, target: heading.element, kind: 'section' });
    });

    if (model.actions.length > 0) items.push({ text: `Optional action: ${model.actions[0].label}`, target: model.actions[0].element, kind: 'action' });
    if (items.length === 0) items.push({ text: 'Read the first visible paragraph.', target: model.root, kind: 'read' });

    return uniqueChecklist(items).slice(0, 10);
  }

  function buildGenericChecklist(model) {
    const items = [];

    if (model.title) items.push({ text: `Read the page title: ${model.title}`, target: model.titleElement, kind: 'title' });

    model.headings.slice(0, 5).forEach((heading) => items.push({ text: `Review section: ${heading.label}`, target: heading.element, kind: 'section' }));
    model.taskLinks.slice(0, 4).forEach((task) => items.push({ text: `Choose task: ${task.label}`, target: task.element, kind: 'task' }));
    model.actions.slice(0, 3).forEach((action) => items.push({ text: `Look for action: ${action.label}`, target: action.element, kind: 'action' }));

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
      const missing = getMissingFields(model).length;
      const fieldCount = model.requiredFields.length || model.fields.length;
      summaryEl.textContent = missing > 0
        ? `I found ${fieldCount} field${fieldCount === 1 ? '' : 's'}. ${missing} required item${missing === 1 ? '' : 's'} may still need attention.`
        : `Required fields look complete. Review everything before submitting.`;
      return;
    }

    if (model.pageType === 'Task Portal') {
      summaryEl.textContent = `I found ${model.taskLinks.length} useful task link${model.taskLinks.length === 1 ? '' : 's'}. I marked the main ones on the page.`;
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
    if (!item || !item.target || !document.contains(item.target)) {
      setStatus('No page target found for that step.');
      return;
    }

    highlightElement(item.target);
    item.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    if (isFocusable(item.target)) setTimeout(() => item.target.focus({ preventScroll: true }), 250);

    setStatus('I highlighted the step on the page.');
  }

  function highlightElement(element) {
    clearTargetHighlight();
    lifeModeState.highlightedElement = element;
    element.classList.add(TARGET_CLASS);
  }

  function clearTargetHighlight() {
    if (lifeModeState.highlightedElement) lifeModeState.highlightedElement.classList.remove(TARGET_CLASS);
    lifeModeState.highlightedElement = null;
  }

  function addTaskLinkBadges(model) {
    clearLinkBadges();
    const taskItems = model.taskLinks.slice(0, 8);

    taskItems.forEach((task, index) => {
      const label = `LifeMode ${index + 1}`;

      task.element.classList.add(LINK_TARGET_CLASS);
      task.element.setAttribute('data-lifemode-task', label);
      task.element.setAttribute('data-lifemode-task-number', String(index + 1));
      task.element.setAttribute('title', `${label}: ${task.label}`);

      lifeModeState.badgedElements.push(task.element);
    });
  }
  function clearLinkBadges() {
    document.querySelectorAll(`.${LINK_BADGE_CLASS}`).forEach((badge) => badge.remove());
    lifeModeState.badgedElements.forEach((element) => {
      if (!element || !element.classList) return;
      element.classList.remove(LINK_TARGET_CLASS);
      element.removeAttribute('data-lifemode-task');
      element.removeAttribute('data-lifemode-task-number');
      element.removeAttribute('title');
    });
    lifeModeState.badgedElements = [];
  }
  function toggleFocusMode() {
    document.documentElement.classList.toggle(FOCUS_CLASS);
    const enabled = document.documentElement.classList.contains(FOCUS_CLASS);
    chrome.storage.local.set({ focusMode: enabled });
    setStatus(enabled ? 'Focus mode is on.' : 'Focus mode is off.');
  }

  function handleCompanion(mode) {
    activateTab('companion');
    const model = lifeModeState.model || buildPageModel();
    if (!lifeModeState.model) lifeModeState.model = model;

    if (mode === 'explain') return companionExplain(model);
    if (mode === 'missing') return companionMissing(model);
    if (mode === 'next') return companionNextStep(model);
    if (mode === 'description') return companionDescription(model);
    if (mode === 'questions') return companionQuestions(model);
  }

  function updatePrivateVaModeBanner() {
    const banner = document.getElementById('lm-private-va-mode');
    if (!banner) return;
    banner.hidden = !isVeteranPage();
  }

  function handleCompanionQuestion() {
    activateTab('companion');

    const input = document.getElementById('lm-companion-question');
    const question = cleanText(input?.value || '', 300).toLowerCase();

    if (!question) {
      return setCompanionOutput(
        'Ask Companion',
        ['Type one thing you need help with.', 'Use plain words. Example: I need to apply for VA disability.', 'You do not need to know the official form name.'],
        'Next: type one sentence and press Ask Companion.'
      );
    }

    if (question.includes('disability') || question.includes('va claim') || question.includes('apply va') || question.includes('file claim')) {
      return handleJourney('va-disability');
    }

    if (question.includes('claim status') || question.includes('check my claim') || question.includes('status')) {
      return handleJourney('check-claim');
    }

    if (question.includes('upload') || question.includes('evidence') || question.includes('document')) {
      return handleJourney('upload-evidence');
    }

    if (question.includes('write') || question.includes('description') || question.includes('statement') || question.includes('explain')) {
      return handleJourney('write-description');
    }

    if (question.includes('overwhelmed') || question.includes('stuck') || question.includes('panic') || question.includes('too much')) {
      return handleJourney('overwhelmed');
    }

    if (question.includes('human') || question.includes('vso') || question.includes('social worker') || question.includes('help')) {
      return handleJourney('find-human');
    }

    setCompanionOutput(
      'Companion heard you',
      [
        `You asked: ${question}`,
        'I can help by explaining this page, checking what may be missing, or making questions for a helper.',
        'If this is about VA disability, use the VA disability journey button.',
      ],
      'Next: choose one journey or one quick local tool.'
    );
  }

  function handleJourney(mode) {
    activateTab('companion');

    if (mode === 'va-disability') {
      return setCompanionOutputWithActions(
        'VA Disability Journey',
        [
          'I can walk with you through the official VA path.',
          'Use only official VA.gov sign-in pages for login.',
          'Private VA Mode: LifeMode does not store your VA password, ID.me login, SSN, or claim numbers.',
          'We will not do everything at once. First we open the official page, then we build a checklist.',
        ],
        'Next: open the official VA disability claim page.',
        [
          { label: 'Open VA disability claim page', href: 'https://www.va.gov/disability/how-to-file-claim/' },
          { label: 'Open online application', href: 'https://www.va.gov/disability/file-disability-claim-form-21-526ez/introduction' },
          { label: 'Find free VSO help', href: 'https://www.va.gov/get-help-from-accredited-representative/' },
          { label: 'Prepare evidence checklist', action: 'evidence-checklist' },
        ]
      );
    }

    if (mode === 'check-claim') {
      return setCompanionOutputWithActions(
        'Check Claim Journey',
        [
          'We will use the official VA claim status path.',
          'Sign in only on VA.gov.',
          'After login, open LifeMode again and choose Check what I am missing.',
          'LifeMode will help you understand the page, but it will not store your login or claim number.',
        ],
        'Next: open official claim status.',
        [
          { label: 'Open claim status', href: 'https://www.va.gov/claim-or-appeal-status/' },
          { label: 'Find VSO help', href: 'https://www.va.gov/get-help-from-accredited-representative/' },
          { label: 'Copy VSO handoff', action: 'copy-vso-handoff' },
        ]
      );
    }

    if (mode === 'upload-evidence') {
      return setCompanionOutputWithActions(
        'Upload Evidence Journey',
        [
          'Evidence can include records, supporting statements, and notes about how the condition affects daily life.',
          'Do not upload anything you are unsure about without asking a qualified helper.',
          'LifeMode can help you make a checklist and draft questions for a VSO.',
        ],
        'Next: prepare the evidence checklist before uploading.',
        [
          { label: 'Evidence checklist', action: 'evidence-checklist' },
          { label: 'Find VSO help', href: 'https://www.va.gov/get-help-from-accredited-representative/' },
          { label: 'Open VA disability page', href: 'https://www.va.gov/disability/how-to-file-claim/' },
        ]
      );
    }

    if (mode === 'write-description') {
      const note = document.getElementById('lm-note')?.value.trim() || '';
      if (!note) {
        return setCompanionOutput(
          'Write a description',
          [
            'First write rough notes in Memory.',
            'Write what happened, what hurts, what you need, or how this affects daily life.',
            'Do not worry about grammar. Companion will help shape it after you write rough notes.',
          ],
          'Next: open Memory and write rough notes.'
        );
      }

      return companionDescription(lifeModeState.model || buildPageModel());
    }

    if (mode === 'overwhelmed') {
      return setCompanionOutputWithActions(
        'Overwhelmed Mode',
        [
          'You do not have to finish everything right now.',
          'Take one breath and do only the next visible step.',
          'If this is bigger than a page, reach a real human.',
          'If you might hurt yourself or cannot stay safe, call or text 988 now. Veterans can call 988 then Press 1.',
        ],
        'Next: choose human help or return to Steps.',
        [
          { label: 'Open Human Help tab', action: 'open-human-help' },
          { label: 'Call 988', href: 'tel:988' },
          { label: 'Veterans Crisis Line', href: 'https://www.veteranscrisisline.net/' },
          { label: 'Copy trusted person message', action: 'copy-trusted' },
        ]
      );
    }

    if (mode === 'find-human') {
      return setCompanionOutputWithActions(
        'Find a Real Human',
        [
          'Software is not enough for every moment.',
          'Choose the kind of human help closest to what you need.',
          'Veterans can use VSO, VA Social Work, Veterans Crisis Line, or trusted person handoff.',
          'Civilians can use 988, 211, local ER, urgent care, mental health help, or trusted person handoff.',
        ],
        'Next: open Human Help.',
        [
          { label: 'Open Human Help tab', action: 'open-human-help' },
          { label: 'Find VSO help', href: 'https://www.va.gov/get-help-from-accredited-representative/' },
          { label: '211 community help', href: 'https://www.211.org/' },
          { label: 'SAMHSA Find Help', href: 'https://www.samhsa.gov/find-help' },
        ]
      );
    }
  }

  function handleJourneyAction(action) {
    if (action === 'evidence-checklist') return showEvidenceChecklist();
    if (action === 'copy-vso-handoff') return copyVsoHandoff();
    if (action === 'copy-trusted') return copyTrustedMessage();
    if (action === 'open-human-help') {
      activateTab('help');
      setStatus('Human Help is open.');
      return;
    }
    if (action === 'open-memory') {
      activateTab('memory');
      setStatus('Memory is open.');
      return;
    }
  }

  function showEvidenceChecklist() {
    setCompanionOutputWithActions(
      'Evidence Checklist',
      [
        'DD214 or separation papers if available.',
        'VA medical records if available.',
        'Private medical records if available.',
        'Supporting statements from people who know what changed.',
        'A short daily-impact note in your own words.',
        'Dates, places, units, or events if you remember them.',
        'Questions for a VSO or accredited representative.',
      ],
      'Next: pick one condition and write one daily-impact note in Memory.',
      [
        { label: 'Open Memory tab', action: 'open-memory' },
        { label: 'Find VSO help', href: 'https://www.va.gov/get-help-from-accredited-representative/' },
        { label: 'Copy VSO handoff', action: 'copy-vso-handoff' },
      ]
    );
  }

  function setCompanionOutputWithActions(title, bullets, nextLine, actions = []) {
    setCompanionOutput(title, bullets, nextLine);

    const output = document.getElementById('lm-companion-output');
    if (!output || actions.length === 0) return;

    const actionGrid = document.createElement('div');
    actionGrid.className = 'lm-journey-actions';

    actions.forEach((action) => {
      if (action.href) {
        const link = document.createElement('a');
        link.href = action.href;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = action.label;
        actionGrid.appendChild(link);
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = action.label;
      button.setAttribute('data-journey-action', action.action);
      actionGrid.appendChild(button);
    });

    output.appendChild(actionGrid);
  }

  async function copyVsoHandoff() {
    const note = document.getElementById('lm-note')?.value.trim() || '';
    const nextStep = document.getElementById('lm-next-step')?.textContent || 'I need help understanding my next step.';
    const text = [
      'Can you help me with my VA disability process?',
      '',
      `Page: ${location.href}`,
      `LifeMode next step: ${nextStep}`,
      note ? `My note: ${note}` : '',
      '',
      'Questions:',
      '1. What should I do next?',
      '2. Am I missing evidence, records, statements, or signatures?',
      '3. Should I submit, save, or wait for review?',
      '4. Is there a deadline I should know about?',
    ].filter(Boolean).join('\n');

    await copyText(text, 'VSO handoff copied.');
  }
  function companionExplain(model) {
    const bullets = [];
    bullets.push(`Page type: ${model.pageType}.`);

    if (model.pageType === 'Task Portal') bullets.push(`I found ${model.taskLinks.length} task links. Pick the one closest to why you came here.`);
    if (model.pageType === 'Form Rescue') bullets.push('This looks like a form. We should fill required fields first, then review before submitting.');
    if (model.pageType === 'Reading Mode') bullets.push('This looks like reading content. Start with the title and intro, then review sections.');
    if (model.title) bullets.push(`Main title: ${model.title}`);

    setCompanionOutput('Explain this page', bullets, 'Start by following the Next step card.');
  }

  function companionMissing(model) {
    if (model.pageType === 'Form Rescue') {
      const missing = getMissingFields(model);
      const requiredCount = model.requiredFields.length;
      const completedCount = Math.max(requiredCount - missing.length, 0);

      if (missing.length === 0) {
        return setCompanionOutput(
          'Application check',
          [
            'Status: Ready for review.',
            requiredCount > 0 ? `${completedCount}/${requiredCount} required fields look filled.` : 'I do not see missing required fields.',
            'Review your answers for accuracy before submitting.',
            'If this affects benefits, health, legal, money, housing, or claims, ask a qualified human helper before final submission when possible.',
          ],
          'Next: review the form slowly before submitting.'
        );
      }

      return setCompanionOutput(
        'Application check',
        [
          'Status: Not ready yet.',
          `${completedCount}/${requiredCount} required fields look complete.`,
          'Missing required fields:',
          ...missing.map((field, index) => `${index + 1}. ${field.label}`),
          'Do not submit until required items are complete.',
        ],
        `Next: fill ${missing[0].label}.`
      );
    }

    if (model.pageType === 'Task Portal') {
      return setCompanionOutput(
        'Check what I am missing',
        [
          'This is a task portal, not a single application.',
          'The missing step is choosing the task closest to your goal.',
          ...model.taskLinks.slice(0, 5).map((task, index) => `Task ${index + 1}: ${task.label}`),
        ],
        'Next: choose one task link.'
      );
    }

    setCompanionOutput(
      'Check what I am missing',
      [
        'I do not see a form with required fields here.',
        'Use the checklist to move through the main page sections.',
        'If you expected an application, look for a button or link that says apply, start, continue, sign in, or submit.',
      ],
      'Next: follow the first unchecked checklist item.'
    );
  }
  function companionNextStep() {
    const next = document.getElementById('lm-next-step')?.textContent || 'Take one small step on this page.';
    setCompanionOutput('What should I do next?', [next, 'Do not solve the whole page right now.', 'Use Go to highlight the area, then complete only that step.'], next);
  }

  function companionDescription(model) {
    const note = document.getElementById('lm-note')?.value.trim() || '';
    if (!note) {
      return setCompanionOutput('Write a plain description', ['Write rough notes in Memory first.', 'Do not worry about grammar. Write what happened, what you need, or where you are stuck.', 'Then press this button again and LifeMode will shape it into a plain draft.'], 'Next: add rough notes in Memory.');
    }

    const draft = [
      'Plain draft from your note:',
      `I am asking for help with this page or process. The part I am stuck on is: ${note}`,
      'I may need help understanding the next step, checking what is missing, or preparing what to send to a qualified helper.',
      'Review this draft. Only keep what is true. Edit anything that does not sound like you.',
    ];

    setCompanionOutput('Write a plain description', draft, 'Next: edit the draft before sending or submitting.');
  }

  function companionQuestions(model) {
    const questions = [
      'What is the safest next step on this page?',
      'Am I missing any required fields, documents, or signatures?',
      'Is there a deadline I should know about?',
      'Should I submit this now, save it, or ask a qualified person to review it first?',
    ];

    if (isVeteranPage()) {
      questions.push('Should I talk to a VSO or accredited representative before I submit?');
      questions.push('Can a VA social worker or case worker help me with this process?');
    }

    if (model.pageType === 'Form Rescue') questions.push('Do my answers match my own records and what is true?');
    if (model.pageType === 'Task Portal') questions.push('Which task link should I use for my specific goal?');

    setCompanionOutput('Questions for a helper', questions, 'Next: copy handoff and send it to a trusted helper.');
  }

  function setCompanionOutput(title, bullets, nextLine) {
    const output = document.getElementById('lm-companion-output');
    const heading = document.getElementById('lm-companion-title');
    if (!output || !heading) return;

    heading.textContent = title;
    output.innerHTML = '';

    const list = document.createElement('ol');
    list.className = 'lm-companion-list';

    bullets.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    const next = document.createElement('p');
    next.className = 'lm-companion-next';
    next.textContent = nextLine;

    output.append(list, next);
    setStatus('Companion response ready.');
  }

  function getMissingFields(model) {
    return model.requiredFields.filter((field) => isFieldEmpty(field.element));
  }

  function isFieldEmpty(field) {
    if (!field) return false;
    if (field.type === 'checkbox') return !field.checked;
    if (field.type === 'radio') {
      const group = field.name ? Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`)) : [field];
      return !group.some((item) => item.checked);
    }
    return !String(field.value || '').trim();
  }

  function getScanRoot() {
    const candidates = Array.from(document.querySelectorAll([
      'form',
      'main',
      'article',
      '[role="main"]',
      '#main-content',
      '.main-content',
      '.entry-content',
      '.post-content',
      '.article-content',
      '.content',
      '#content',
    ].join(','))).filter((el) => isUsableElement(el) && !isIgnoredElement(el));

    if (candidates.length === 0) return document.body;

    return candidates.map((el) => ({ element: el, score: scoreScanRoot(el) })).sort((a, b) => b.score - a.score)[0].element;
  }

  function scoreScanRoot(el) {
    const textLength = normalizeText(el.innerText || el.textContent).length;
    const fields = el.querySelectorAll('input, select, textarea').length;
    const requiredFields = Array.from(el.querySelectorAll('input, select, textarea')).filter((field) => isRequiredField(field)).length;
    const headings = el.querySelectorAll('h1, h2, h3').length;
    const taskLinks = getTaskLinks(el).length;
    const isForm = el.matches('form') ? 2200 : 0;
    const isMain = el.matches('main, [role="main"], #main-content') ? 1000 : 0;
    const isArticle = el.matches('article') ? 750 : 0;

    return textLength + fields * 120 + requiredFields * 600 + headings * 90 + taskLinks * 220 + isForm + isMain + isArticle;
  }

  function getVisibleFields(root) {
    return Array.from(root.querySelectorAll('input, select, textarea'))
      .filter((field) => isUsableElement(field) && !isIgnoredElement(field))
      .filter((field) => !field.disabled && field.type !== 'hidden')
      .map((field) => ({ element: field, label: getFieldLabel(field) }))
      .filter((field) => field.label && !isNoiseFieldLabel(field.label));
  }

  function isRequiredField(field) {
    if (!field || !(field instanceof Element)) return false;
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
      const labelText = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ');
      if (labelText) return stripRequiredMarker(cleanText(labelText));
    }

    const wrappedLabel = field.closest('label');
    if (wrappedLabel && isUsableElement(wrappedLabel)) return stripRequiredMarker(cleanText(wrappedLabel.textContent));

    return stripRequiredMarker(cleanText(field.getAttribute('aria-label') || field.getAttribute('placeholder') || field.name || field.id || 'field'));
  }

  function getUsefulHeadings(root) {
    return Array.from(root.querySelectorAll('h1, h2, h3'))
      .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
      .map((el) => ({ element: el, label: cleanText(el.textContent) }))
      .filter((heading) => heading.label && heading.label.length > 8 && !isNoiseText(heading.label))
      .slice(0, 12);
  }

  function getTaskLinks(root) {
    const links = Array.from(root.querySelectorAll('a[href], button'))
      .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
      .map((el) => ({ element: el, label: cleanText(el.innerText || el.value || el.getAttribute('aria-label') || el.textContent, 120), href: el.getAttribute('href') || '' }))
      .filter((item) => item.label && item.label.length >= 4 && item.label.length <= 120)
      .filter((item) => !isNoiseText(item.label) && !isNoiseHref(item.href))
      .filter((item) => isTaskText(item.label));

    return uniqueByLabel(links).slice(0, 12);
  }

  function getPrimaryActions(root) {
    return Array.from(root.querySelectorAll('button, input[type="submit"], input[type="button"], a[href]'))
      .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
      .map((el) => ({ element: el, label: cleanText(el.innerText || el.value || el.getAttribute('aria-label') || el.textContent) }))
      .filter((action) => isActionText(action.label) && !isNoiseText(action.label))
      .slice(0, 8);
  }

  function getPageTitleInfo(root) {
    const element = root.querySelector('h1') || document.querySelector('h1');
    const text = element ? cleanText(element.textContent) : cleanText(document.title);

    if (!text || isNoiseText(text)) return { text: '', element: root || document.body };
    return { text, element: element || root || document.body };
  }

  function getFirstUsefulParagraphInfo(root) {
    const paragraph = Array.from(root.querySelectorAll('p'))
      .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
      .map((el) => ({ element: el, text: cleanText(el.textContent, 260) }))
      .find((item) => item.text.length > 40 && !isNoiseText(item.text));

    if (!paragraph) return { text: '', element: root || document.body };
    return paragraph;
  }

  function uniqueByLabel(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = cleanText(item.label).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

    const identity = [el.id, typeof el.className === 'string' ? el.className : '', el.getAttribute('role'), el.getAttribute('aria-label'), el.getAttribute('name')].join(' ').toLowerCase();
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

  function isNoiseHref(href) {
    const value = String(href || '').toLowerCase();
    return value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:') || value === '#';
  }

  function isNoiseFieldLabel(text) {
    const value = cleanText(text).toLowerCase();
    return ['plays sound', 'contains adult content', 'covers the page', 'report this ad', 'why this ad', 'other', 'close'].includes(value) || value.includes('report ad');
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

  function isTaskText(text) {
    const value = cleanText(text).toLowerCase();
    if (!value || value.length < 4 || value.length > 120) return false;

    return [
      'check',
      'claim',
      'appeal',
      'benefit',
      'benefits',
      'manage',
      'download',
      'view',
      'verify',
      'file',
      'review',
      'create',
      'account',
      'sign in',
      'apply',
      'get started',
      'find',
      'form',
      'location',
      'appointment',
      'health',
      'disability',
      'letter',
      'letters',
      'education',
      'dependents',
      'payment',
      'reimbursement',
      'search',
      'upload',
      'submit',
    ].some((word) => value.includes(word));
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
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setStatus('Reading stopped.');
  }

  function openLocalHelpSearch(query) {
    const safeQuery = cleanText(query, 120);
    const locationText = cleanText(document.getElementById('lm-help-zip')?.value || '', 80);
    const searchText = locationText ? `${safeQuery} near ${locationText}` : `${safeQuery} near me`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText)}`;

    window.open(url, '_blank', 'noopener');
    setStatus(locationText ? `Opening local search near ${locationText}.` : 'Opening near-me local search.');
  }

  function openEmergencySearchWithLocation() {
    if (!navigator.geolocation) {
      setStatus('Location is not available. Enter ZIP code instead.');
      return;
    }

    setStatus('Asking browser for one-time location. Nothing is saved.');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude).toFixed(5);
        const lng = Number(position.coords.longitude).toFixed(5);
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`emergency room near ${lat},${lng}`)}`;
        window.open(url, '_blank', 'noopener');
        setStatus('Opening nearest ER search. Location was not saved.');
      },
      () => {
        setStatus('Location was not allowed. Enter ZIP code or use a near-me button.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
    );
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

    await copyText(text, 'Handoff copied.');
  }

  async function copyTrustedMessage() {
    const nextStep = document.getElementById('lm-next-step')?.textContent || 'I need help figuring out my next step.';
    const note = document.getElementById('lm-note')?.value.trim();
    const text = [
      'Can you help me with this page?',
      '',
      `I am stuck here: ${location.href}`,
      `LifeMode says my next step is: ${nextStep}`,
      note ? `My note: ${note}` : '',
      '',
      'I may need help understanding what is missing or deciding what to do next.',
    ].filter(Boolean).join('\n');

    await copyText(text, 'Trusted person message copied.');
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
    } catch (error) {
      setStatus('Could not copy text.');
    }
  }

  function getChecklistText() {
    return lifeModeState.items.map((item, index) => `${index + 1}. ${item.text}`).join('\n');
  }

  function prepareMemoryNote() {
    lifeModeState.noteKey = `lifemode-note:${location.origin}${location.pathname}`;

    chrome.storage.local.get([lifeModeState.noteKey]).then((result) => {
      const noteEl = document.getElementById('lm-note');
      if (noteEl && result[lifeModeState.noteKey]) noteEl.value = result[lifeModeState.noteKey];
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

  function prepareWelcomeCard() {
    chrome.storage.local.get(['lifemode-welcome-seen']).then((result) => {
      const card = document.getElementById('lm-first-run');
      if (card && result['lifemode-welcome-seen']) {
        card.hidden = true;
      }
    });
  }

  function dismissWelcomeCard() {
    const card = document.getElementById('lm-first-run');
    if (card) card.hidden = true;
    chrome.storage.local.set({ 'lifemode-welcome-seen': true });
    setStatus('Welcome hidden. You can keep working.');
  }
  function getPanelStateKey() {
    // Store only origin + pathname. Do not store query strings, hashes, page text, or form content.
    return `${PANEL_STATE_PREFIX}${location.origin}${location.pathname}`;
  }

  function persistPanelOpen(isOpen) {
    const key = getPanelStateKey();

    if (isOpen) {
      chrome.storage.local.set({ [key]: true });
      return;
    }

    chrome.storage.local.remove(key);
  }

  function restorePanelOpenState() {
    const key = getPanelStateKey();

    chrome.storage.local.get([key]).then((result) => {
      if (!result[key]) return;

      window.setTimeout(() => {
        openLifeModePanel();
      }, 250);
    });
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

    return ['submit', 'continue', 'next', 'save', 'apply', 'send', 'upload', 'download', 'sign in', 'log in', 'start', 'finish', 'review', 'accept', 'search'].some((word) => value.includes(word));
  }

  function isVeteranPage() {
    const value = `${location.hostname} ${document.title} ${document.body?.innerText || ''}`.toLowerCase();
    return value.includes('va.gov') || value.includes('veteran') || value.includes('vso') || value.includes('disability claim');
  }

  function isFocusable(el) {
    return el.matches('input, select, textarea, button, a[href], [tabindex]');
  }

  function setStatus(message) {
    const status = document.getElementById('lm-status');
    if (status) status.textContent = message;
  }

  chrome.storage.local.get(['focusMode']).then((settings) => {
    if (settings.focusMode) document.documentElement.classList.add(FOCUS_CLASS);
  });

  restorePanelOpenState();
  // SPRINT6_JOURNEY_EVENT_DELEGATION
  document.addEventListener('click', handleLifeModeJourneyDelegatedClick, true);

  function handleLifeModeJourneyDelegatedClick(event) {
    const target = event.target;
    if (!target || !(target instanceof Element)) return;

    const panel = target.closest(`#${LIFEMODE_PANEL_ID}`);
    if (!panel) return;

    const askButton = target.closest('[data-action="ask-companion"]');
    if (askButton) {
      event.preventDefault();
      event.stopPropagation();
      handleCompanionQuestion();
      return;
    }

    const journeyButton = target.closest('[data-journey]');
    if (journeyButton) {
      event.preventDefault();
      event.stopPropagation();

      const mode = journeyButton.getAttribute('data-journey');

      if (mode === 'write-description') {
        const note = document.getElementById('lm-note')?.value.trim() || '';

        if (!note) {
          setCompanionOutputWithActions(
            'Write a description',
            [
              'First write rough notes in Memory.',
              'Write what happened, what hurts, what you need, or how this affects daily life.',
              'Do not worry about grammar. Companion will help shape it after you write rough notes.',
            ],
            'Next: open Memory and write rough notes.',
            [
              { label: 'Open Memory tab', action: 'open-memory' },
              { label: 'Copy trusted person message', action: 'copy-trusted' },
            ]
          );
          return;
        }
      }

      handleJourney(mode);
      return;
    }

    const journeyAction = target.closest('[data-journey-action]');
    if (journeyAction) {
      event.preventDefault();
      event.stopPropagation();

      const action = journeyAction.getAttribute('data-journey-action');

      if (action === 'open-memory') {
        activateTab('memory');
        const note = document.getElementById('lm-note');
        if (note) setTimeout(() => note.focus(), 150);
        setStatus('Memory is open. Write rough notes here.');
        return;
      }

      handleJourneyAction(action);
    }
  }
  // SPRINT7_WALK_WITH_ME_DD214
  const WALK_STATE_PREFIX = 'lifemode-walk-state:';

  const walkBootTimer = window.setInterval(() => {
    if (ensureWalkMode()) {
      window.clearInterval(walkBootTimer);
    }
  }, 250);

  window.setTimeout(() => window.clearInterval(walkBootTimer), 12000);

  new MutationObserver(() => {
    ensureWalkMode();
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('GSB_LIFEMODE_OPEN', () => {
    window.setTimeout(() => ensureWalkMode(), 60);
  });

  document.addEventListener('click', handleWalkDelegatedClick, true);

  function ensureWalkMode() {
    const panel = document.getElementById(LIFEMODE_PANEL_ID);
    if (!panel) return false;

    if (!document.getElementById('lm-walk-mode')) {
      const walk = document.createElement('section');
      walk.id = 'lm-walk-mode';
      walk.className = 'lm-walk-screen';
      walk.setAttribute('aria-label', 'Walk With Me');
      walk.innerHTML = '<div id="lm-walk-content"></div>';

      const tabs = panel.querySelector('.lm-tabs');
      if (tabs) {
        tabs.insertAdjacentElement('beforebegin', walk);
      } else {
        panel.appendChild(walk);
      }
    }

    if (!panel.classList.contains('lm-walk-ready')) {
      panel.classList.add('lm-walk-ready', 'lm-walk-default');
      renderWalkResumeOrHome();
    }

    updatePrivateVaModeBanner();
    return true;
  }

  function handleWalkDelegatedClick(event) {
    const target = event.target;
    if (!target || !(target instanceof Element)) return;

    const panel = target.closest(`#${LIFEMODE_PANEL_ID}`);
    if (!panel) return;

    const askButton = target.closest('[data-action="ask-companion"]');
    if (askButton) {
      const question = cleanText(document.getElementById('lm-companion-question')?.value || '', 300).toLowerCase();
      if (isDd214Intent(question)) {
        event.preventDefault();
        event.stopPropagation();
        startWalkJourney('dd214-records');
        return;
      }
    }

    const journeyButton = target.closest('[data-journey]');
    if (journeyButton) {
      const mode = journeyButton.getAttribute('data-journey');

      if (mode === 'va-disability') {
        event.preventDefault();
        event.stopPropagation();
        startWalkJourney('va-disability');
        return;
      }

      if (mode === 'check-claim') {
        event.preventDefault();
        event.stopPropagation();
        startWalkJourney('check-claim');
        return;
      }

      if (mode === 'upload-evidence') {
        event.preventDefault();
        event.stopPropagation();
        startWalkJourney('upload-evidence');
        return;
      }

      if (mode === 'write-description') {
        event.preventDefault();
        event.stopPropagation();
        startWalkJourney('write-what-happened');
        return;
      }

      if (mode === 'overwhelmed') {
        event.preventDefault();
        event.stopPropagation();
        startWalkJourney('overwhelmed');
        return;
      }

      if (mode === 'find-human') {
        event.preventDefault();
        event.stopPropagation();
        startWalkJourney('need-human');
        return;
      }
    }

    const goalButton = target.closest('[data-walk-goal]');
    if (goalButton) {
      event.preventDefault();
      event.stopPropagation();
      startWalkJourney(goalButton.getAttribute('data-walk-goal'));
      return;
    }

    const actionButton = target.closest('[data-walk-action]');
    if (actionButton) {
      event.preventDefault();
      event.stopPropagation();
      handleWalkAction(actionButton);
    }
  }

  function isDd214Intent(value) {
    const text = cleanText(value, 300).toLowerCase();
    return text.includes('dd214') ||
      text.includes('dd 214') ||
      text.includes('dd-214') ||
      text.includes('service record') ||
      text.includes('service records') ||
      text.includes('military record') ||
      text.includes('military records') ||
      text.includes('separation paper') ||
      text.includes('separation papers') ||
      text.includes('discharge paper') ||
      text.includes('discharge papers');
  }

  function getWalkStateKey() {
    return `${WALK_STATE_PREFIX}${location.origin}${location.pathname}`;
  }

  function getWalkFlows() {
    return {
      'va-disability': {
        label: 'Apply for VA disability',
        steps: [
          {
            title: 'Open the official VA disability page.',
            detail: 'Do not sign in anywhere except VA.gov.',
            primaryLabel: 'Open official VA page',
            url: 'https://www.va.gov/disability/how-to-file-claim/',
          },
          {
            title: 'Sign in only on VA.gov.',
            detail: 'Private VA Mode is on. LifeMode does not store your VA password, ID.me login, SSN, or claim number.',
            primaryLabel: 'Open online application',
            url: 'https://www.va.gov/disability/file-disability-claim-form-21-526ez/introduction',
          },
          {
            title: 'Choose what you are working on.',
            detail: 'Start new claim, continue saved claim, upload evidence, check status, or ask a helper if you are not sure.',
            primaryLabel: 'Show VA task options',
            special: 'va-task-options',
          },
          {
            title: 'Make your evidence checklist.',
            detail: 'You do not need everything right now. Start with what you have.',
            primaryLabel: 'Show evidence checklist',
            special: 'evidence',
          },
          {
            title: 'Write your daily impact note.',
            detail: 'Use rough words. Do not worry about grammar. Write how this affects sleep, work, body, family, memory, mood, or daily life.',
            primaryLabel: 'Save rough note',
            special: 'daily-note',
          },
          {
            title: 'Before submitting, consider asking a qualified human helper.',
            detail: 'LifeMode can make a clean handoff for a VSO or accredited representative.',
            primaryLabel: 'Copy VSO handoff',
            special: 'vso',
          },
        ],
      },
      'dd214-records': {
        label: 'Get DD214 / service records',
        steps: [
          {
            title: 'Start with the official VA records page.',
            detail: 'Your DD214 is part of your military service records. Use official VA.gov or National Archives pages.',
            primaryLabel: 'Open VA records page',
            url: 'https://www.va.gov/records/get-military-service-records/',
          },
          {
            title: 'Choose how you want to request records.',
            detail: 'Most Veterans can request records online through National Archives eVetRecs, or use Standard Form 180 by mail or fax.',
            primaryLabel: 'Show request options',
            special: 'dd214-options',
          },
          {
            title: 'Gather only what the request asks for.',
            detail: 'Do not save SSN or private identifiers inside LifeMode. Keep sensitive information on the official site or form.',
            primaryLabel: 'Show info checklist',
            special: 'dd214-info',
          },
          {
            title: 'Submit through the official source.',
            detail: 'If you are applying for VA benefits, VA may request your DD214 after receiving your application. If you need your own copy, use official records paths.',
            primaryLabel: 'Open eVetRecs',
            url: 'https://vetrecs.archives.gov/',
          },
          {
            title: 'Save where you stopped.',
            detail: 'Copy a clean handoff if you need a VSO, county Veteran office, or trusted person to help.',
            primaryLabel: 'Copy records handoff',
            special: 'dd214-handoff',
          },
        ],
      },
      'check-claim': {
        label: 'Check my VA claim',
        steps: [
          {
            title: 'Open the official VA claim status page.',
            detail: 'Sign in only on VA.gov.',
            primaryLabel: 'Open claim status',
            url: 'https://www.va.gov/claim-or-appeal-status/',
          },
          {
            title: 'Read the status slowly.',
            detail: 'Use LifeMode to explain the page after it loads. Do not try to solve the whole thing at once.',
            primaryLabel: 'Open More tools',
            special: 'more-tools',
          },
          {
            title: 'If you are confused, ask a VSO.',
            detail: 'A helper can explain what the status means and what to do next.',
            primaryLabel: 'Copy VSO handoff',
            special: 'vso',
          },
        ],
      },
      'upload-evidence': {
        label: 'Upload evidence',
        steps: [
          {
            title: 'Prepare before uploading.',
            detail: 'List what you have first. Do not upload something you are unsure about without asking a qualified helper.',
            primaryLabel: 'Show evidence checklist',
            special: 'evidence',
          },
          {
            title: 'Open the official VA page.',
            detail: 'Use VA.gov only. LifeMode does not store your login or claim number.',
            primaryLabel: 'Open VA disability page',
            url: 'https://www.va.gov/disability/how-to-file-claim/',
          },
          {
            title: 'Ask a helper if unsure.',
            detail: 'If this evidence affects a claim, it is okay to ask a VSO before submitting.',
            primaryLabel: 'Copy VSO handoff',
            special: 'vso',
          },
        ],
      },
      'write-what-happened': {
        label: 'Write what happened',
        steps: [
          {
            title: 'Write rough notes.',
            detail: 'Use your words. Do not worry about grammar. Write what happened and how it affects daily life.',
            primaryLabel: 'Save rough note',
            special: 'daily-note',
          },
          {
            title: 'Make it clearer.',
            detail: 'LifeMode can shape your rough note into a plain draft. Review it. Only keep what is true.',
            primaryLabel: 'Help make this clearer',
            special: 'description',
          },
          {
            title: 'Prepare questions for a helper.',
            detail: 'If this is for a claim or important form, ask a qualified person to review it.',
            primaryLabel: 'Copy VSO handoff',
            special: 'vso',
          },
        ],
      },
      'overwhelmed': {
        label: 'I am overwhelmed',
        steps: [
          {
            title: 'Stop trying to finish everything.',
            detail: 'You do not have to finish the whole page right now. Take one breath. Choose one small step.',
            primaryLabel: 'Show Human Help',
            special: 'human-help',
          },
          {
            title: 'If this is bigger than a page, reach a real human.',
            detail: 'If you might hurt yourself or cannot stay safe, call or text 988 now. Veterans can call 988 then Press 1.',
            primaryLabel: 'Call 988',
            url: 'tel:988',
          },
        ],
      },
      'need-human': {
        label: 'I need a human',
        steps: [
          {
            title: 'Open Human Help.',
            detail: 'Choose the kind of human help closest to what you need.',
            primaryLabel: 'Show Human Help',
            special: 'human-help',
          },
          {
            title: 'Send a clean message to someone you trust.',
            detail: 'LifeMode can copy where you are stuck and what the next step is.',
            primaryLabel: 'Copy trusted person message',
            special: 'trusted',
          },
        ],
      },
    };
  }

  function renderWalkResumeOrHome() {
    chrome.storage.local.get([getWalkStateKey()]).then((result) => {
      const state = result[getWalkStateKey()];
      if (state && state.goal) {
        renderWalkResume(state);
        return;
      }

      renderWalkHome();
    });
  }

  function renderWalkHome() {
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Walk With Me</div>
      <h3>What are you trying to do today?</h3>
      <p class="lm-muted">Choose one. LifeMode will show one step at a time.</p>

      <div class="lm-walk-options">
        <button type="button" data-walk-goal="va-disability">Apply for VA disability</button>
        <button type="button" data-walk-goal="dd214-records">Get DD214 / service records</button>
        <button type="button" data-walk-goal="check-claim">Check my VA claim</button>
        <button type="button" data-walk-goal="upload-evidence">Upload evidence</button>
        <button type="button" data-walk-goal="write-what-happened">Write what happened</button>
        <button type="button" data-walk-goal="overwhelmed">I am overwhelmed</button>
        <button type="button" data-walk-goal="need-human">I need a human</button>
      </div>

      <button type="button" class="lm-wide-button lm-light-button" data-walk-action="more-tools">More tools</button>
    `;
  }

  function renderWalkResume(state) {
    const flow = getWalkFlows()[state.goal];
    if (!flow) return renderWalkHome();

    const stepIndex = Math.min(Number(state.step || 0), flow.steps.length - 1);
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Welcome back</div>
      <h3>You were working on:</h3>
      <p class="lm-walk-title">${escapeWalkHtml(flow.label)} - Step ${stepIndex + 1} of ${flow.steps.length}</p>
      <p class="lm-muted">LifeMode saved the step, not your private answers.</p>

      <div class="lm-walk-actions">
        <button type="button" data-walk-action="resume">Resume</button>
        <button type="button" data-walk-action="start-over">Start over</button>
        <button type="button" data-walk-action="more-tools">More tools</button>
      </div>
    `;
  }

  function startWalkJourney(goal) {
    const flow = getWalkFlows()[goal];
    if (!flow) return;

    const panel = document.getElementById(LIFEMODE_PANEL_ID);
    if (panel) panel.classList.add('lm-walk-default');

    const walk = document.getElementById('lm-walk-mode');
    if (walk) walk.hidden = false;

    const state = { goal, step: 0 };
    saveWalkState(state);
    renderWalkStep(state);
  }

  function saveWalkState(state) {
    chrome.storage.local.set({ [getWalkStateKey()]: state });
  }

  function clearWalkState() {
    chrome.storage.local.remove(getWalkStateKey());
  }

  function getCurrentWalkState() {
    const container = document.getElementById('lm-walk-content');
    return {
      goal: container?.getAttribute('data-goal') || '',
      step: Number(container?.getAttribute('data-step') || 0),
    };
  }

  function renderWalkStep(state) {
    const flow = getWalkFlows()[state.goal];
    if (!flow) return renderWalkHome();

    const stepIndex = Math.max(0, Math.min(Number(state.step || 0), flow.steps.length - 1));
    const step = flow.steps[stepIndex];
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.setAttribute('data-goal', state.goal);
    container.setAttribute('data-step', String(stepIndex));

    const backButton = stepIndex > 0
      ? '<button type="button" data-walk-action="back">Back</button>'
      : '<button type="button" data-walk-action="start-over">Start over</button>';

    container.innerHTML = `
      <div class="lm-badge">Walk With Me</div>
      <p class="lm-walk-progress">Step ${stepIndex + 1} of ${flow.steps.length}</p>
      <h3>${escapeWalkHtml(step.title)}</h3>
      <p class="lm-muted">${escapeWalkHtml(step.detail)}</p>

      ${renderWalkPrimary(step)}

      <div class="lm-walk-bottom">
        ${backButton}
        <button type="button" data-walk-action="did-this">I did this</button>
        <button type="button" data-walk-action="stuck">I am stuck</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
        <button type="button" data-walk-action="more-tools">More tools</button>
      </div>
    `;
  }

  function renderWalkPrimary(step) {
    if (step.url) {
      return `<button type="button" class="lm-walk-main" data-walk-action="open-url" data-url="${escapeWalkHtml(step.url)}">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    if (step.special === 'daily-note') {
      return `
        <textarea id="lm-walk-note" class="lm-companion-question" rows="5" placeholder="Write rough notes here. Example: My back pain affects my sleep and work."></textarea>
        <button type="button" class="lm-walk-main" data-walk-action="save-walk-note">${escapeWalkHtml(step.primaryLabel)}</button>
      `;
    }

    if (step.special === 'va-task-options') {
      return `
        <div class="lm-walk-options">
          <button type="button" data-walk-action="open-url" data-url="https://www.va.gov/disability/file-disability-claim-form-21-526ez/introduction">Start new disability claim</button>
          <button type="button" data-walk-action="open-url" data-url="https://www.va.gov/claim-or-appeal-status/">Continue or check claim</button>
          <button type="button" data-walk-action="evidence">Upload / prepare evidence</button>
          <button type="button" data-walk-action="talk-human">I do not know</button>
        </div>
      `;
    }

    if (step.special === 'dd214-options') {
      return `
        <div class="lm-walk-options">
          <button type="button" data-walk-action="open-url" data-url="https://vetrecs.archives.gov/">Request online with eVetRecs</button>
          <button type="button" data-walk-action="open-url" data-url="https://www.va.gov/records/get-military-service-records/">Open VA instructions</button>
          <button type="button" data-walk-action="open-url" data-url="https://www.archives.gov/veterans/military-service-records">Open National Archives</button>
          <button type="button" data-walk-action="open-url" data-url="https://milconnect.dmdc.osd.mil/milconnect/">Open milConnect</button>
        </div>
      `;
    }

    if (step.special === 'dd214-info') {
      return `<button type="button" class="lm-walk-main" data-walk-action="dd214-info">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    if (step.special === 'dd214-handoff') {
      return `<button type="button" class="lm-walk-main" data-walk-action="copy-records-handoff">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    if (step.special === 'evidence') {
      return `<button type="button" class="lm-walk-main" data-walk-action="evidence">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    if (step.special === 'description') {
      return `<button type="button" class="lm-walk-main" data-walk-action="description">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    if (step.special === 'vso') {
      return `<button type="button" class="lm-walk-main" data-walk-action="copy-vso">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    if (step.special === 'human-help') {
      return `<button type="button" class="lm-walk-main" data-walk-action="talk-human">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    if (step.special === 'trusted') {
      return `<button type="button" class="lm-walk-main" data-walk-action="copy-trusted">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    if (step.special === 'more-tools') {
      return `<button type="button" class="lm-walk-main" data-walk-action="more-tools">${escapeWalkHtml(step.primaryLabel)}</button>`;
    }

    return `<button type="button" class="lm-walk-main" data-walk-action="did-this">${escapeWalkHtml(step.primaryLabel || 'I did this')}</button>`;
  }

  function handleWalkAction(button) {
    const action = button.getAttribute('data-walk-action');

    if (action === 'more-tools') return showWalkMoreTools('steps');
    if (action === 'talk-human') return showWalkMoreTools('help');
    if (action === 'resume') return renderWalkStep(getCurrentOrDefaultWalkState());
    if (action === 'start-over') {
      clearWalkState();
      renderWalkHome();
      return;
    }

    if (action === 'open-url') {
      const url = button.getAttribute('data-url');
      if (url) window.open(url, '_blank', 'noopener');
      setStatus('Opened official page. Come back and click I did this.');
      return;
    }

    if (action === 'did-this') return advanceWalkStep();
    if (action === 'back') return moveWalkStep(-1);
    if (action === 'stuck') return renderWalkStuck();
    if (action === 'evidence') return renderWalkEvidenceChecklist();
    if (action === 'dd214-info') return renderDd214InfoChecklist();
    if (action === 'description') return walkDescriptionDraft();
    if (action === 'copy-vso') return copyVsoHandoff();
    if (action === 'copy-records-handoff') return copyRecordsHandoff();
    if (action === 'copy-trusted') return copyTrustedMessage();
    if (action === 'save-walk-note') return saveWalkNoteAndAdvance();
  }

  function getCurrentOrDefaultWalkState() {
    const current = getCurrentWalkState();
    if (current.goal) return current;
    return { goal: 'va-disability', step: 0 };
  }

  function advanceWalkStep() {
    const current = getCurrentWalkState();
    const flow = getWalkFlows()[current.goal];
    if (!flow) return renderWalkHome();

    const nextStep = Number(current.step || 0) + 1;

    if (nextStep >= flow.steps.length) {
      const done = { goal: current.goal, step: flow.steps.length - 1, complete: true };
      saveWalkState(done);
      renderWalkComplete(flow);
      return;
    }

    const state = { goal: current.goal, step: nextStep };
    saveWalkState(state);
    renderWalkStep(state);
  }

  function moveWalkStep(delta) {
    const current = getCurrentWalkState();
    const flow = getWalkFlows()[current.goal];
    if (!flow) return renderWalkHome();

    const nextStep = Math.max(0, Math.min(Number(current.step || 0) + delta, flow.steps.length - 1));
    const state = { goal: current.goal, step: nextStep };
    saveWalkState(state);
    renderWalkStep(state);
  }

  function renderWalkStuck() {
    const current = getCurrentWalkState();
    const flow = getWalkFlows()[current.goal] || { label: 'this task', steps: [] };
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">You are not failing</div>
      <h3>That is okay. This page is heavy.</h3>
      <p class="lm-muted">You do not have to finish everything right now. Choose one safe next move.</p>

      <div class="lm-walk-actions">
        <button type="button" data-walk-action="resume">Try this step again</button>
        <button type="button" data-walk-action="copy-trusted">Copy message to helper</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
        <button type="button" data-walk-action="more-tools">More tools</button>
      </div>

      <p class="lm-note-help">Current path: ${escapeWalkHtml(flow.label)}</p>
    `;
  }

  function renderWalkEvidenceChecklist() {
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Evidence checklist</div>
      <h3>Start with what you have.</h3>
      <p class="lm-muted">You do not need everything right now. This is only a guide.</p>

      <ul class="lm-walk-list">
        <li>DD214 or separation papers</li>
        <li>VA medical records</li>
        <li>Private medical records</li>
        <li>Supporting statements from people who know what changed</li>
        <li>Daily impact note in your own words</li>
        <li>Dates, places, units, or events if you remember them</li>
      </ul>

      <div class="lm-walk-bottom">
        <button type="button" data-walk-action="resume">Back to step</button>
        <button type="button" data-walk-action="did-this">I did this</button>
        <button type="button" data-walk-action="copy-vso">Copy VSO handoff</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
      </div>
    `;
  }

  function renderDd214InfoChecklist() {
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">DD214 request info</div>
      <h3>Gather only what the official request asks for.</h3>
      <p class="lm-muted">Do not save SSN, service number, or private identifiers inside LifeMode.</p>

      <ul class="lm-walk-list">
        <li>Name used while in service</li>
        <li>Branch of service</li>
        <li>Approximate dates of service</li>
        <li>Date and place of birth</li>
        <li>Service number or SSN only on the official form/site</li>
        <li>If records may be fire-related: place of discharge, last unit, and place of entry if known</li>
      </ul>

      <div class="lm-walk-bottom">
        <button type="button" data-walk-action="resume">Back to step</button>
        <button type="button" data-walk-action="did-this">I understand</button>
        <button type="button" data-walk-action="copy-records-handoff">Copy records handoff</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
      </div>
    `;
  }

  function saveWalkNoteAndAdvance() {
    const text = document.getElementById('lm-walk-note')?.value.trim() || '';
    if (!text) {
      setStatus('Write rough notes first. A few words is enough.');
      return;
    }

    const noteEl = document.getElementById('lm-note');
    if (noteEl) noteEl.value = text;

    chrome.storage.local.set({ [lifeModeState.noteKey]: text });
    setStatus('Rough note saved in Memory.');
    advanceWalkStep();
  }

  function walkDescriptionDraft() {
    const note = document.getElementById('lm-note')?.value.trim() || '';
    if (!note) {
      renderWalkStep({ goal: 'write-what-happened', step: 0 });
      setStatus('Write rough notes first.');
      return;
    }

    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Plain draft</div>
      <h3>Review this. Only keep what is true.</h3>
      <p class="lm-muted">LifeMode shaped your rough note into clearer words. Edit before using anywhere.</p>

      <div class="lm-walk-draft">
        I am asking for help with this process. The part I am trying to explain is: ${escapeWalkHtml(note)}
        <br><br>
        This affects my daily life, and I may need help understanding what evidence, records, or next steps are needed.
      </div>

      <div class="lm-walk-bottom">
        <button type="button" data-walk-action="resume">Back to step</button>
        <button type="button" data-walk-action="copy-vso">Copy VSO handoff</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
        <button type="button" data-walk-action="more-tools">More tools</button>
      </div>
    `;
  }

  async function copyRecordsHandoff() {
    const text = [
      'Can you help me request my DD214 or military service records?',
      '',
      `Page: ${location.href}`,
      '',
      'LifeMode says I may need help with:',
      '1. Choosing the right official request path',
      '2. Knowing whether to use eVetRecs, SF-180, milConnect, or a personnel command',
      '3. Avoiding unofficial paid services if a free official path works',
      '4. Checking what information I need before I submit',
      '',
      'Please help me take the next step.',
    ].join('\n');

    await copyText(text, 'Records handoff copied.');
  }

  function renderWalkComplete(flow) {
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Saved</div>
      <h3>You do not have to finish today.</h3>
      <p class="lm-muted">Saved where you stopped: ${escapeWalkHtml(flow.label)}.</p>

      <div class="lm-walk-actions">
        <button type="button" data-walk-action="start-over">Start over</button>
        <button type="button" data-walk-action="copy-vso">Copy VSO handoff</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
        <button type="button" data-walk-action="more-tools">More tools</button>
      </div>
    `;
  }

  function showWalkMoreTools(tabName = 'steps') {
    const panel = document.getElementById(LIFEMODE_PANEL_ID);
    if (panel) panel.classList.remove('lm-walk-default');

    const walk = document.getElementById('lm-walk-mode');
    if (walk) walk.hidden = true;

    activateTab(tabName);
    setStatus('More tools are open.');
  }

  function escapeWalkHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  // SPRINT8_NO_THINKING_MODE

  function getWalkStateKey() {
    // Global journey memory across pages.
    // Stores only goal + step, not answers, form values, VA login, SSN, claim number, or page text.
    return `${WALK_STATE_PREFIX}global`;
  }

  function renderWalkHome() {
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Walk With Me</div>
      <h3>What are you trying to do today?</h3>
      <p class="lm-muted">Choose one. LifeMode will show one step at a time.</p>

      <div class="lm-walk-options">
        <button type="button" data-walk-goal="va-disability">Apply for VA disability</button>
        <button type="button" data-walk-goal="dd214-records">Get DD214 / service records</button>
        <button type="button" data-walk-goal="check-claim">Check my VA claim</button>
        <button type="button" data-walk-goal="upload-evidence">Upload evidence</button>
        <button type="button" data-walk-goal="write-what-happened">Write what happened</button>
        <button type="button" data-walk-goal="overwhelmed">I am overwhelmed</button>
        <button type="button" data-walk-goal="need-human">I need a human</button>
      </div>

      <button type="button" class="lm-wide-button lm-light-button" data-walk-action="more-tools">Show advanced tools</button>
    `;
  }

  function renderWalkResume(state) {
    const flow = getWalkFlows()[state.goal];
    if (!flow) return renderWalkHome();

    const stepIndex = Math.min(Number(state.step || 0), flow.steps.length - 1);
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Welcome back</div>
      <h3>You were working on:</h3>
      <p class="lm-walk-title">${escapeWalkHtml(flow.label)} - Step ${stepIndex + 1} of ${flow.steps.length}</p>
      <p class="lm-muted">LifeMode saved the step, not your private answers.</p>

      <div class="lm-walk-actions">
        <button type="button" data-walk-action="resume">Resume</button>
        <button type="button" data-walk-action="start-over">Start over</button>
        <button type="button" data-walk-action="save-stop">Save and stop for today</button>
        <button type="button" data-walk-action="more-tools">Show advanced tools</button>
      </div>
    `;
  }

  function renderWalkStep(state) {
    const flow = getWalkFlows()[state.goal];
    if (!flow) return renderWalkHome();

    const stepIndex = Math.max(0, Math.min(Number(state.step || 0), flow.steps.length - 1));
    const step = flow.steps[stepIndex];
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.setAttribute('data-goal', state.goal);
    container.setAttribute('data-step', String(stepIndex));

    const backButton = stepIndex > 0
      ? '<button type="button" data-walk-action="back">Back</button>'
      : '<button type="button" data-walk-action="start-over">Start over</button>';

    container.innerHTML = `
      <div class="lm-badge">Walk With Me</div>
      <p class="lm-walk-progress">Step ${stepIndex + 1} of ${flow.steps.length}</p>
      <h3>${escapeWalkHtml(step.title)}</h3>
      <p class="lm-muted">${escapeWalkHtml(step.detail)}</p>

      <button type="button" class="lm-step-read" data-walk-action="read-step">Read this step</button>

      ${renderWalkPrimary(step)}

      <div class="lm-walk-bottom lm-walk-primary-actions">
        ${backButton}
        <button type="button" data-walk-action="did-this">I did this</button>
        <button type="button" data-walk-action="stuck">I am stuck</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
      </div>

      <div class="lm-walk-secondary-actions">
        <button type="button" data-walk-action="save-stop">Save and stop for today</button>
        <button type="button" data-walk-action="create-helper-packet">Copy helper packet</button>
        <button type="button" data-walk-action="more-tools">Show advanced tools</button>
      </div>
    `;
  }

  function handleWalkAction(button) {
    const action = button.getAttribute('data-walk-action');

    if (action === 'more-tools') return showWalkMoreTools('steps');
    if (action === 'talk-human') return renderWalkHumanTriage();
    if (action === 'read-step') return readCurrentWalkStep();
    if (action === 'save-stop') return renderSaveAndStopForToday();
    if (action === 'create-helper-packet') return copyHelperPacket();
    if (action === 'human-urgent') return renderUrgentHumanHelp();
    if (action === 'human-benefits') return renderBenefitsHumanHelp();
    if (action === 'human-trusted') return copyTrustedMessage();
    if (action === 'human-local') return showWalkMoreTools('help');
    if (action === 'stuck-page') return renderStuckPageWillNotOpen();
    if (action === 'stuck-meaning') return renderStuckMeaning();
    if (action === 'stuck-signin') return renderStuckSignIn();
    if (action === 'stuck-document') return renderStuckMissingDocument();
    if (action === 'stuck-overwhelmed') return startWalkJourney('overwhelmed');

    if (action === 'resume') return renderWalkStep(getCurrentOrDefaultWalkState());
    if (action === 'start-over') {
      clearWalkState();
      renderWalkHome();
      setStatus('Journey cleared. Start where you are.');
      return;
    }

    if (action === 'open-url') {
      const url = button.getAttribute('data-url');
      if (url) window.open(url, '_blank', 'noopener');
      setStatus('Opened official page. Come back and click I did this.');
      return;
    }

    if (action === 'did-this') return advanceWalkStep();
    if (action === 'back') return moveWalkStep(-1);
    if (action === 'stuck') return renderWalkStuck();
    if (action === 'evidence') return renderWalkEvidenceChecklist();
    if (action === 'dd214-info') return renderDd214InfoChecklist();
    if (action === 'description') return walkDescriptionDraft();
    if (action === 'copy-vso') return copyVsoHandoff();
    if (action === 'copy-records-handoff') return copyRecordsHandoff();
    if (action === 'copy-trusted') return copyTrustedMessage();
    if (action === 'save-walk-note') return saveWalkNoteAndAdvance();
  }

  function advanceWalkStep() {
    const current = getCurrentWalkState();
    const flow = getWalkFlows()[current.goal];
    if (!flow) return renderWalkHome();

    const nextStep = Number(current.step || 0) + 1;

    if (nextStep >= flow.steps.length) {
      const done = { goal: current.goal, step: flow.steps.length - 1, complete: true, updatedAt: Date.now() };
      saveWalkState(done);
      renderWalkComplete(flow);
      setStatus('Checkpoint saved. This path is complete enough for now.');
      return;
    }

    const state = { goal: current.goal, step: nextStep, updatedAt: Date.now() };
    saveWalkState(state);
    renderWalkStep(state);
    setStatus(`Checkpoint saved. You are now on Step ${nextStep + 1} of ${flow.steps.length}.`);
  }

  function renderWalkStuck() {
    const current = getCurrentWalkState();
    const flow = getWalkFlows()[current.goal] || { label: 'this task', steps: [] };
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">You are not failing</div>
      <h3>What kind of stuck?</h3>
      <p class="lm-muted">Pick the closest one. You do not need to explain it perfectly.</p>

      <div class="lm-walk-options">
        <button type="button" data-walk-action="stuck-page">Page will not open</button>
        <button type="button" data-walk-action="stuck-meaning">I do not know what this means</button>
        <button type="button" data-walk-action="stuck-signin">I cannot sign in</button>
        <button type="button" data-walk-action="stuck-document">I do not have this document</button>
        <button type="button" data-walk-action="stuck-overwhelmed">I am overwhelmed</button>
        <button type="button" data-walk-action="talk-human">I need a human</button>
      </div>

      <div class="lm-walk-secondary-actions">
        <button type="button" data-walk-action="resume">Try this step again</button>
        <button type="button" data-walk-action="create-helper-packet">Copy helper packet</button>
        <button type="button" data-walk-action="save-stop">Save and stop for today</button>
      </div>

      <p class="lm-note-help">Current path: ${escapeWalkHtml(flow.label)}</p>
    `;
  }

  function renderStuckPageWillNotOpen() {
    renderSimpleWalkMessage(
      'Page will not open',
      [
        'Check if the internet is working.',
        'Try opening the official page again.',
        'If it still fails, copy a helper packet or ask a human to open it with you.',
      ],
      [
        { label: 'Try again', action: 'resume' },
        { label: 'Copy helper packet', action: 'create-helper-packet' },
        { label: 'Talk to a human', action: 'talk-human' },
      ]
    );
  }

  function renderStuckMeaning() {
    renderSimpleWalkMessage(
      'This page is hard to understand',
      [
        'That is the page, not you.',
        'Use Show advanced tools if you want Companion to explain the current page.',
        'Or copy a helper packet so a person can see where you are stuck.',
      ],
      [
        { label: 'Show advanced tools', action: 'more-tools' },
        { label: 'Copy helper packet', action: 'create-helper-packet' },
        { label: 'Talk to a human', action: 'talk-human' },
      ]
    );
  }

  function renderStuckSignIn() {
    renderSimpleWalkMessage(
      'Sign-in is its own step',
      [
        'Use only official VA.gov, Login.gov, or ID.me sign-in pages.',
        'LifeMode does not store your password, ID.me login, SSN, or claim number.',
        'If sign-in fails repeatedly, stop and ask a real human for help.',
      ],
      [
        { label: 'Try this step again', action: 'resume' },
        { label: 'Talk to a human', action: 'talk-human' },
        { label: 'Save and stop', action: 'save-stop' },
      ]
    );
  }

  function renderStuckMissingDocument() {
    renderSimpleWalkMessage(
      'Missing document',
      [
        'That is common. Missing a document does not mean you failed.',
        'Start a missing document list.',
        'If the missing document is DD214, use the DD214 / service records journey.',
      ],
      [
        { label: 'Get DD214 / service records', goal: 'dd214-records' },
        { label: 'Copy helper packet', action: 'create-helper-packet' },
        { label: 'Talk to a human', action: 'talk-human' },
      ]
    );
  }

  function renderWalkHumanTriage() {
    renderSimpleWalkMessage(
      'What kind of human help?',
      [
        'Choose one door first. You can always come back.',
      ],
      [
        { label: 'I need help now', action: 'human-urgent' },
        { label: 'Veteran benefits help', action: 'human-benefits' },
        { label: 'Someone I trust', action: 'human-trusted' },
        { label: 'Local civilian help', action: 'human-local' },
        { label: 'Back to step', action: 'resume' },
      ]
    );
  }

  function renderUrgentHumanHelp() {
    renderSimpleWalkMessage(
      'Reach a real human now',
      [
        'If there is immediate danger, call emergency services now.',
        'Call or text 988 if you are in crisis or need someone to talk to.',
        'Veterans can call 988 then Press 1 or text 838255.',
      ],
      [
        { label: 'Call 988', href: 'tel:988' },
        { label: 'Text 988', href: 'sms:988' },
        { label: 'Text Veterans Crisis Line', href: 'sms:838255' },
        { label: 'Human Help tab', action: 'human-local' },
      ]
    );
  }

  function renderBenefitsHumanHelp() {
    renderSimpleWalkMessage(
      'Veteran benefits help',
      [
        'For claims and benefits, a VSO or accredited representative is the safer human path.',
        'LifeMode can make a packet so you do not have to explain from zero.',
      ],
      [
        { label: 'Find VSO / accredited help', href: 'https://www.va.gov/get-help-from-accredited-representative/' },
        { label: 'VA Social Work', href: 'https://www.socialwork.va.gov/' },
        { label: 'Copy helper packet', action: 'create-helper-packet' },
        { label: 'Back to step', action: 'resume' },
      ]
    );
  }

  function renderSaveAndStopForToday() {
    const current = getCurrentWalkState();
    const flow = getWalkFlows()[current.goal] || { label: 'this task', steps: [] };
    const stepIndex = Math.min(Number(current.step || 0), Math.max(flow.steps.length - 1, 0));
    saveWalkState({ goal: current.goal, step: stepIndex, updatedAt: Date.now(), paused: true });

    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Checkpoint saved</div>
      <h3>You did enough for now.</h3>
      <p class="lm-muted">Next time, LifeMode can bring you back to: ${escapeWalkHtml(flow.label)} - Step ${stepIndex + 1}.</p>

      <div class="lm-walk-actions">
        <button type="button" data-walk-action="resume">Resume now</button>
        <button type="button" data-walk-action="create-helper-packet">Copy helper packet</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
        <button type="button" data-walk-action="start-over">Start over</button>
      </div>
    `;
  }

  function renderWalkComplete(flow) {
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="lm-badge">Saved</div>
      <h3>You do not have to finish today.</h3>
      <p class="lm-muted">Saved where you stopped: ${escapeWalkHtml(flow.label)}.</p>

      <div class="lm-walk-actions">
        <button type="button" data-walk-action="create-helper-packet">Copy helper packet</button>
        <button type="button" data-walk-action="talk-human">Talk to a human</button>
        <button type="button" data-walk-action="save-stop">Save and stop for today</button>
        <button type="button" data-walk-action="start-over">Start over</button>
      </div>
    `;
  }

  function renderSimpleWalkMessage(title, bullets, actions = []) {
    const container = document.getElementById('lm-walk-content');
    if (!container) return;

    const bulletList = bullets.map((item) => `<li>${escapeWalkHtml(item)}</li>`).join('');
    const buttons = actions.map((item) => {
      if (item.href) {
        return `<a class="lm-walk-action-link" href="${escapeWalkHtml(item.href)}" target="_blank" rel="noopener">${escapeWalkHtml(item.label)}</a>`;
      }

      if (item.goal) {
        return `<button type="button" data-walk-goal="${escapeWalkHtml(item.goal)}">${escapeWalkHtml(item.label)}</button>`;
      }

      return `<button type="button" data-walk-action="${escapeWalkHtml(item.action)}">${escapeWalkHtml(item.label)}</button>`;
    }).join('');

    container.innerHTML = `
      <div class="lm-badge">Walk With Me</div>
      <h3>${escapeWalkHtml(title)}</h3>
      <ul class="lm-walk-list">${bulletList}</ul>
      <div class="lm-walk-options">${buttons}</div>
    `;
  }

  function readCurrentWalkStep() {
    const current = getCurrentWalkState();
    const flow = getWalkFlows()[current.goal];
    if (!flow) return;

    const step = flow.steps[Math.min(Number(current.step || 0), flow.steps.length - 1)];
    if (!step) return;

    const text = `LifeMode. Step ${Number(current.step || 0) + 1} of ${flow.steps.length}. ${step.title}. ${step.detail}`;

    if (!('speechSynthesis' in window)) {
      setStatus('Read aloud is not available in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
    setStatus('Reading this step.');
  }

  async function copyHelperPacket() {
    const current = getCurrentWalkState();
    const flow = getWalkFlows()[current.goal] || { label: 'Current task', steps: [] };
    const stepIndex = Math.min(Number(current.step || 0), Math.max(flow.steps.length - 1, 0));
    const step = flow.steps[stepIndex] || {};
    const note = document.getElementById('lm-note')?.value.trim() || '';

    const packet = [
      `LifeMode helper packet: ${flow.label}`,
      '',
      `Current step: Step ${stepIndex + 1} of ${flow.steps.length || 1}`,
      `Step title: ${step.title || 'Not available'}`,
      `Step detail: ${step.detail || 'Not available'}`,
      '',
      note ? `Memory note: ${note}` : 'Memory note: none yet',
      '',
      'Questions for helper:',
      '1. What should I do next?',
      '2. Am I missing any records, documents, signatures, or deadlines?',
      '3. Should I submit now, save it, or ask someone to review it first?',
      '4. Is there a safer official page or person I should use?',
      '',
      `Page: ${location.href}`,
    ].join('\n');

    await copyText(packet, 'Helper packet copied.');
  }
})();
