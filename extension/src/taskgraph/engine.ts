// Task Graph engine — the moat.
//
// A curated, versioned library of how real-world processes actually work. The AI
// MAPS a confusing page onto a known template instead of reasoning from scratch
// every time. That's what makes output reliable where raw Gemini Nano isn't, and
// it's the asset competitors can't copy quickly: it's hand-curated domain knowledge.
//
// Templates are DATA, not code. Ship them from the backend registry so you can
// update "how to file a VA claim" without shipping a new extension.

import type { ExtractedPage, TaskTemplate, TaskStep } from '../lib/types';

let registry: TaskTemplate[] = [];

/** Load templates (from bundled defaults or backend registry). */
export function loadTemplates(templates: TaskTemplate[]): void {
  registry = templates;
}

/** Cheap, deterministic first-pass match on origin + keywords. */
export function matchTemplate(page: ExtractedPage): TaskTemplate | undefined {
  const haystack = `${page.origin} ${page.pathname} ${page.title}`.toLowerCase();
  let best: { t: TaskTemplate; score: number } | undefined;
  for (const t of registry) {
    const score = t.matchHints.reduce(
      (s, hint) => (haystack.includes(hint.toLowerCase()) ? s + 1 : s),
      0,
    );
    if (score > 0 && (!best || score > best.score)) best = { t, score };
  }
  return best?.t;
}

/** Given a template + what's on the page, pick the single next step. */
export function nextStep(
  template: TaskTemplate,
  page: ExtractedPage,
): TaskStep {
  // If the page shows errors, the next step is whatever the error blocks.
  // Otherwise, first step whose "doneWhen" isn't yet visibly satisfied.
  const unmet = template.steps.find(
    (s) => !page.summary || !page.summary.toLowerCase().includes(s.doneWhen.toLowerCase()),
  );
  return unmet ?? template.steps[0];
}

/** Fallback when no template matches: build a generic checklist from the page. */
export function genericSteps(page: ExtractedPage): TaskStep[] {
  const required = page.fields.filter((f) => f.required);
  return required.slice(0, 5).map((f, i) => ({
    id: `generic_${i}`,
    title: `Fill in: ${f.label}`,
    plainExplanation: f.helpText || `This box needs your ${f.label.toLowerCase()}.`,
    whatYouNeed: [],
    doneWhen: `${f.label} is filled`,
  }));
}
