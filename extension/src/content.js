(() => {
  if (window.__gsbLifeModeLoaded) {
    window.dispatchEvent(new CustomEvent('GSB_LIFEMODE_OPEN'));
    return;
  }

  window.__gsbLifeModeLoaded = true;

  const LIFEMODE_PANEL_ID = 'gsb-lifemode-panel';
  const FOCUS_CLASS = 'gsb-lifemode-focus';
  const TARGET_CLASS = 'gsb-lifemode-target';
  const TASK_CLASS = 'gsb-lifemode-task-link';
  const BADGE_CLASS = 'gsb-lifemode-task-badge';

  const lifeModeState = {
    items: [],
    model: null,
    highlightedElement: null,
    noteKey: '',
    activeTab: 'steps',
    badges: [],
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

  window.addEventListener('GSB_LIFEMODE_OPEN', () => {
    openLifeModePanel();
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
    panel.setAttribute('aria-label', 'LifeMode companion panel');

    panel.innerHTML = `
      <div class="lm-panel-header">
        <div>
          <p class="lm-kicker">GSB LifeMode</p>
          <h2>LifeMode Companion</h2>
        </div>
        <button type="button" class="lm-close" aria-label="Close LifeMode">x</button>
      </div>

      <p class="lm-intro">One clear next step when the page feels too heavy.</p>

      <nav class="lm-tabs" role="tablist" aria-label="LifeMode sections">
        <button type="button" class="lm-tab is-active" data-tab="steps" role="tab" aria-selected="true">Steps</button>
        <button type="button" class="lm-tab" data-tab="companion" role="tab" aria-selected="false">Companion</button>
        <button type="button" class="lm-tab" data-tab="memory" role="tab" aria-selected="false">Memory</button>
        <button type="button" class="lm-tab" data-tab="help" role="tab" aria-selected="false">Human Help</button>
      </nav>

      <section class="lm-tab-panel is-active" data-panel="steps" role="tabpanel">
        <section class="lm-card lm-summary-card" aria-labelledby="lm-summary-title">
          <div id="lm-page-type" class="lm-badge">Scanning page</div>
          <h3 id="lm-summary-title">Page rescue</h3>
          <p id="lm-summary">Open LifeMode, then start with one step.</p>
        </section>

        <div class="lm-actions">
          <button type="button" data-action="scan">Refresh checklist</button>
          <button type="button" data-action="start">Start first step</button>
          <button type="button" data-action="highlight-links">Highlight links</button>
          <button type="button" data-action="focus">Focus mode</button>
          <button type="button" data-action="read">Read aloud</button>
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
          <h3>Ask Companion</h3>
          <p class="lm-note-help">This local prototype gives guidance from the current page scan. It is not medical, legal, or claims advice.</p>
          <div class="lm-companion-actions">
            <button type="button" data-companion="explain">Explain this page</button>
            <button type="button" data-companion="missing">Check what I'm missing</button>
            <button type="button" data-companion="next">What should I do next?</button>
            <button type="button" data-companion="description">Write plain description</button>
            <button type="button" data-companion="questions">Prepare helper questions</button>
          </div>
        </section>

        <section class="lm-card">
          <h3>Rough notes</h3>
          <p class="lm-note-help">Write messy notes. Companion can turn them into a plain draft you can edit.</p>
          <textarea id="lm-rough-notes" rows="4" placeholder="Example: Back pain started after deployment. Hard to sleep. I need help explaining it."></textarea>
        </section>

        <section class="lm-card lm-companion-output-card">
          <h3>Companion response</h3>
          <div id="lm-companion-output" class="lm-companion-output">
            Choose a Companion button above.
          </div>
        </section>
      </section>

      <section class="lm-tab-panel" data-panel="memory" role="tabpanel" hidden>
        <section class="lm-card" aria-labelledby="lm-note-title">
          <h3 id="lm-note-title">Memory note</h3>
          <p class="lm-note-help">Write one thing you do not want to forget on this page. Saved only in this browser.</p>
          <textarea id="lm-note" rows="4" placeholder="Example: Come back and upload ID tomorrow."></textarea>
          <div class="lm-note-actions">
            <button type="button" data-action="save-note">Save note</button>
            <button type="button" data-action="clear-note">Clear</button>
          </div>
        </section>

        <section class="lm-card">
          <h3>Handoff</h3>
          <p class="lm-note-help">Copy the current summary, next step, checklist, and memory note to send to a trusted person.</p>
          <button type="button" class="lm-wide-button" data-action="copy">Copy handoff</button>
        </section>
      </section>

      <section class="lm-tab-panel" data-panel="help" role="tabpanel" hidden>
        <section class="lm-card lm-help-card">
          <h3>Human Help</h3>
          <p class="lm-note-help">LifeMode should never trap you inside software when a human is the right next step.</p>
          <div class="lm-help-grid">
            <a href="https://www.veteranscrisisline.net/" target="_blank" rel="noreferrer">Veterans Crisis Line</a>
            <a href="https://988lifeline.org/" target="_blank" rel="noreferrer">988 Lifeline</a>
            <a href="https://www.va.gov/get-help-from-accredited-representative/" target="_blank" rel="noreferrer">Find VSO / accredited rep</a>
            <a href="https://www.socialwork.va.gov/" target="_blank" rel="noreferrer">VA Social Work</a>
            <a href="https://www.va.gov/find-locations/" target="_blank" rel="noreferrer">Find VA location</a>
            <a href="https://www.woundedwarriorproject.org/programs" target="_blank" rel="noreferrer">Wounded Warrior Project</a>
          </div>
        </section>

        <section class="lm-card">
          <h3>Quick message</h3>
          <p class="lm-note-help">Use this when you need to ask a human for help with the page.</p>
          <button type="button" class="lm-wide-button" data-action="copy-help">Copy help request</button>
          <div id="lm-help-message" class="lm-companion-output">
            I am stuck on this page and need help with the next step.
          </div>
        </section>
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

    panel.querySelectorAll('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => switchTab(button.getAttribute('data-tab')));
    });

    panel.querySelector('[data-action="scan"]').addEventListener('click', runScan);
    panel.querySelector('[data-action="start"]').addEventListener('click', startFirstStep);
    panel.querySelector('[data-action="highlight-links"]').addEventListener('click', () => {
      const count = highlightTaskLinks();
      setStatus(count ? `Highlighted ${count} task link${count === 1 ? '' : 's'} on the page.` : 'No task links found to highlight.');
    });
    panel.querySelector('[data-action="focus"]').addEventListener('click', toggleFocusMode);
    panel.querySelector('[data-action="read"]').addEventListener('click', readPageSummary);
    panel.querySelector('[data-action="copy"]').addEventListener('click', copyHandoff);
    panel.querySelector('[data-action="copy-help"]').addEventListener('click', copyHelpRequest);
    panel.querySelector('[data-action="stop"]').addEventListener('click', stopReading);
    panel.querySelector('[data-action="save-note"]').addEventListener('click', saveMemoryNote);
    panel.querySelector('[data-action="clear-note"]').addEventListener('click', clearMemoryNote);

    panel.querySelectorAll('[data-companion]').forEach((button) => {
      button.addEventListener('click', () => runCompanionAction(button.getAttribute('data-companion')));
    });

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

  function switchTab(tabName) {
    lifeModeState.activeTab = tabName;

    document.querySelectorAll(`#${LIFEMODE_PANEL_ID} [data-tab]`).forEach((button) => {
      const isActive = button.getAttribute('data-tab') === tabName;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll(`#${LIFEMODE_PANEL_ID} [data-panel]`).forEach((panel) => {
      const isActive = panel.getAttribute('data-panel') === tabName;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
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

    if (model.pageType === 'Task Portal') {
      highlightTaskLinks();
    } else {
      clearTaskLinkHighlights();
    }

    updateHelpMessage();
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
    if (model.requiredFields.length > 0 || model.fields.length >= 3 || model.root.matches('form')) {
      return 'Form Rescue';
    }

    if (model.taskLinks.length >= 4) {
      return 'Task Portal';
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

    if (model.pageType === 'Task Portal') {
      return buildTaskPortalChecklist(model);
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

  function buildTaskPortalChecklist(model) {
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

    model.taskLinks.slice(0, 8).forEach((task, index) => {
      items.push({
        text: `Choose task ${index + 1}: ${task.label}`,
        target: task.element,
        kind: 'task',
      });
    });

    if (model.actions.length > 0) {
      items.push({
        text: `Optional action: ${model.actions[0].label}`,
        target: model.actions[0].element,
        kind: 'action',
      });
    }

    return uniqueChecklist(items).slice(0, 10);
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

    model.taskLinks.slice(0, 4).forEach((task, index) => {
      items.push({ text: `Choose task ${index + 1}: ${task.label}`, target: task.element, kind: 'task' });
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

    if (model.pageType === 'Task Portal') {
      summaryEl.textContent = `I found ${model.taskLinks.length} useful task link${model.taskLinks.length === 1 ? '' : 's'}. I numbered the links on the page so you can choose the task closest to why you came here.`;
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

  function highlightTaskLinks() {
    clearTaskLinkHighlights();

    const model = lifeModeState.model;
    if (!model || !model.taskLinks || model.taskLinks.length === 0) return 0;

    model.taskLinks.slice(0, 12).forEach((task, index) => {
      const element = task.element;
      if (!element || !document.contains(element)) return;

      element.classList.add(TASK_CLASS);
      element.setAttribute('data-lifemode-task-number', String(index + 1));

      const badge = document.createElement('span');
      badge.className = BADGE_CLASS;
      badge.textContent = `LifeMode ${index + 1}`;
      badge.setAttribute('aria-hidden', 'true');

      element.insertAdjacentElement('beforebegin', badge);
      lifeModeState.badges.push({ element, badge });
    });

    return lifeModeState.badges.length;
  }

  function clearTaskLinkHighlights() {
    lifeModeState.badges.forEach(({ element, badge }) => {
      if (element && document.contains(element)) {
        element.classList.remove(TASK_CLASS);
        element.removeAttribute('data-lifemode-task-number');
      }

      if (badge && document.contains(badge)) {
        badge.remove();
      }
    });

    lifeModeState.badges = [];
  }

  function runCompanionAction(action) {
    if (!lifeModeState.model) {
      runScan();
    }

    const output = document.getElementById('lm-companion-output');
    if (!output) return;

    const model = lifeModeState.model;
    let lines = [];

    if (action === 'explain') {
      lines = explainPage(model);
    } else if (action === 'missing') {
      lines = checkMissing(model);
    } else if (action === 'next') {
      lines = explainNextStep();
    } else if (action === 'description') {
      lines = writePlainDescription(model);
    } else if (action === 'questions') {
      lines = prepareHelperQuestions(model);
    } else {
      lines = ['I am here to help you take one step.'];
    }

    output.innerHTML = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
    setStatus('Companion response ready.');
  }

  function explainPage(model) {
    if (model.pageType === 'Form Rescue') {
      return [
        'Simple version: this page is asking you to complete a form.',
        `I found ${model.requiredFields.length || model.fields.length} field${(model.requiredFields.length || model.fields.length) === 1 ? '' : 's'} to handle.`,
        'Do not try to finish everything in your head. Start with the first field in the checklist.',
      ];
    }

    if (model.pageType === 'Task Portal') {
      return [
        'Simple version: this page is a doorway to several tasks.',
        'I numbered the useful task links on the page.',
        'Choose the link that matches why you came here, then ignore the rest for now.',
      ];
    }

    if (model.pageType === 'Reading Mode') {
      return [
        'Simple version: this page is mostly information.',
        'Start with the title and short intro.',
        'Then review one section at a time. You do not need to absorb everything at once.',
      ];
    }

    return [
      'Simple version: this page has several possible actions.',
      'Start with the next step card.',
      'Use the checklist to move one item at a time.',
    ];
  }

  function checkMissing(model) {
    if (model.pageType === 'Form Rescue') {
      const missing = model.fields.filter((field) => isEmptyField(field.element));
      if (missing.length === 0) {
        return [
          'Application check: I do not see empty visible fields in the scanned area.',
          'Next step: review the page for upload requirements, signature boxes, warnings, or submit/review buttons.',
          'If this is a VA claim or legal/benefit form, consider asking a VSO or accredited helper before submitting.',
        ];
      }

      return [
        `Application check: I found ${missing.length} field${missing.length === 1 ? '' : 's'} that may still need attention.`,
        `Start here: ${missing[0].label}`,
        'After filling the fields, look for a review, save, continue, or submit button.',
      ];
    }

    if (model.pageType === 'Task Portal') {
      return [
        'Task check: this page does not look like an application form yet.',
        'What may be missing is the correct task choice.',
        'Next step: choose the task link closest to why you came here, such as claim status, VA form, appointment, letter, or location.',
      ];
    }

    return [
      'I do not see a full application form in the scanned area.',
      'If you expected a form, look for a start, sign in, apply, upload, or continue button.',
      'If you are stuck, copy the handoff and send it to a trusted helper.',
    ];
  }

  function explainNextStep() {
    const nextStep = document.getElementById('lm-next-step')?.textContent || 'Take one small step on this page.';
    return [
      `Next step: ${nextStep}`,
      'Do only that. Do not solve the whole page right now.',
      'When it is done, check it off and LifeMode will move the next step forward.',
    ];
  }

  function writePlainDescription(model) {
    const notes = document.getElementById('lm-rough-notes')?.value.trim() || '';

    if (!notes) {
      return [
        'Write a few messy notes first.',
        'Use plain facts: what happened, what hurts, what changed, what you need help with, and what deadline exists.',
        'Then press this button again and I will turn it into a clean draft you can edit.',
      ];
    }

    return [
      'Plain description draft:',
      `I am asking for help with this page: ${model.title || document.title || 'current page'}.`,
      `My rough notes are: ${notes}`,
      'I need help understanding what is missing, what to do next, and whether I should ask a human helper before submitting anything.',
      'Edit this before sending. Only keep what is true and accurate.',
    ];
  }

  function prepareHelperQuestions(model) {
    if (model.pageType === 'Form Rescue') {
      return [
        'Questions to ask a helper:',
        '1. Am I using the correct form?',
        '2. Are any required fields still missing?',
        '3. Do I need to upload evidence, ID, records, or a signature?',
        '4. Should I save, review, or submit next?',
        '5. Is there a deadline I should not miss?',
      ];
    }

    if (model.pageType === 'Task Portal') {
      return [
        'Questions to ask a helper:',
        '1. Which task link should I choose for my situation?',
        '2. Do I need to sign in first?',
        '3. Should I check status, find a form, book an appointment, or contact a representative?',
        '4. What document or account information should I have ready?',
      ];
    }

    return [
      'Questions to ask a helper:',
      '1. What is this page asking me to do?',
      '2. What should I click first?',
      '3. What information should I gather before continuing?',
      '4. Can you stay with me while I finish the next step?',
    ];
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
      '#main-content',
      '.main-content',
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

  function getTaskLinks(root) {
    const links = Array.from(root.querySelectorAll('a[href], button'))
      .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
      .map((el) => ({
        element: el,
        label: cleanText(el.innerText || el.value || el.getAttribute('aria-label') || el.textContent, 120),
        href: el.getAttribute('href') || '',
      }))
      .filter((item) => item.label && item.label.length >= 4 && item.label.length <= 120)
      .filter((item) => !isNoiseText(item.label) && !isNoiseHref(item.href))
      .filter((item) => isTaskText(item.label));

    return uniqueByLabel(links).slice(0, 12);
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

  function getPageTitleInfo(root) {
    const element = root.querySelector('h1') || document.querySelector('h1');
    const text = element ? cleanText(element.textContent) : cleanText(document.title);

    if (!text || isNoiseText(text)) {
      return { text: '', element: root || document.body };
    }

    return { text, element: element || root || document.body };
  }

  function getFirstUsefulParagraphInfo(root) {
    const paragraph = Array.from(root.querySelectorAll('p'))
      .filter((el) => isUsableElement(el) && !isIgnoredElement(el))
      .map((el) => ({ element: el, text: cleanText(el.textContent, 260) }))
      .find((item) => item.text.length > 40 && !isNoiseText(item.text));

    if (!paragraph) {
      return { text: '', element: root || document.body };
    }

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

  function isNoiseHref(href) {
    const value = String(href || '').toLowerCase();
    return value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:') || value === '#';
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
    ].some((word) => value.includes(word));
  }

  function readPageSummary() {
    const nextStep = document.getElementById('lm-next-step')?.textContent || '';
    const summary = document.getElementById('lm-summary')?.textContent || '';
    const items = getChecklistText();
    const text = `LifeMode Companion. ${summary}. Next step. ${nextStep}. Checklist. ${items}`;

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

  async function copyHelpRequest() {
    const message = updateHelpMessage();

    try {
      await navigator.clipboard.writeText(message);
      setStatus('Help request copied.');
    } catch (error) {
      setStatus('Could not copy help request.');
    }
  }

  function updateHelpMessage() {
    const nextStep = document.getElementById('lm-next-step')?.textContent || 'I need help finding the next step.';
    const title = lifeModeState.model?.title || document.title || 'this page';
    const message = [
      `I am stuck on this page: ${title}`,
      `Next step LifeMode found: ${nextStep}`,
      `Page: ${location.href}`,
      'Can you help me complete this one step?',
    ].join('\n');

    const helpMessage = document.getElementById('lm-help-message');
    if (helpMessage) {
      helpMessage.textContent = message;
    }

    return message;
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

  function isEmptyField(field) {
    if (!field) return false;

    if (field.matches('input[type="checkbox"], input[type="radio"]')) {
      const name = field.getAttribute('name');
      if (!name) return !field.checked;
      return !Array.from(document.querySelectorAll(`input[name="${CSS.escape(name)}"]`)).some((item) => item.checked);
    }

    return !String(field.value || '').trim();
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
      'search',
    ].some((word) => value.includes(word));
  }

  function isFocusable(el) {
    return el.matches('input, select, textarea, button, a[href], [tabindex]');
  }

  function escapeHtml(value) {
    const span = document.createElement('span');
    span.textContent = value;
    return span.innerHTML;
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
})();