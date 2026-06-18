// Orchestrator — ties the pipeline together into ONE clear next step.
// This is what the side panel calls. Everything upstream (extract, AI, task graph,
// memory, analytics) feeds into a single, calm output.

import { extractPage } from '../content/extract';
import { summarizePage, localAvailable } from '../ai/router';
import { loadTemplates, matchTemplate, nextStep, genericSteps } from '../taskgraph/engine';
import { allTemplates } from '../taskgraph/index';
import { loadMemory, matchMemoryToFields } from '../lib/memory';
import { trackEvent } from '../lib/analytics';
import type { TaskStep, AiTier } from '../lib/types';

export interface NextStepResult {
  summary: string;
  step: TaskStep;
  templateId: string;
  templateVersion: string;
  aiTier: AiTier;
  autofillSuggestions: string[]; // labels we can offer to fill from memory
  matchedKnownProcess: boolean;
}

loadTemplates(allTemplates);

export async function computeNextStep(): Promise<NextStepResult> {
  const page = extractPage();

  // 1. Plain-language summary (local AI, falls back to empty -> template text)
  const summaryRes = await summarizePage(page);
  page.summary = summaryRes.text;

  // 2. Map onto a curated process if we know it
  const template = matchTemplate(page);
  const matchedKnownProcess = Boolean(template);

  let step: TaskStep;
  let templateId = 'generic';
  let templateVersion = '0';
  if (template) {
    step = nextStep(template, page);
    templateId = template.id;
    templateVersion = template.version;
  } else {
    const steps = genericSteps(page);
    step = steps[0] ?? {
      id: 'read',
      title: 'Read the page slowly',
      plainExplanation: 'There is no form here yet. Take a breath and read the top of the page.',
      whatYouNeed: [],
      doneWhen: 'You understand what this page wants',
    };
  }

  // 3. Offer autofill from saved memory
  const memory = await loadMemory();
  const matches = matchMemoryToFields(memory, page.fields.map((f) => f.label));

  // 4. Record an anonymous "started" event (only if consented)
  void trackEvent({ templateId, templateVersion, stepId: step.id, status: 'started', jurisdiction: template?.jurisdiction });

  const summary =
    page.summary ||
    (template
      ? `This looks like: ${template.displayName}. Your next step is below.`
      : 'Here is one clear next step for this page.');

  return {
    summary,
    step,
    templateId,
    templateVersion,
    aiTier: summaryRes.tier,
    autofillSuggestions: Object.keys(matches),
    matchedKnownProcess,
  };
}

export async function aiStatus(): Promise<'local' | 'cloud_only'> {
  return (await localAvailable()) ? 'local' : 'cloud_only';
}
