// AI router — the heart of "powerful backend, but private by default".
//
// Strategy:
//   1. On-device Gemini Nano (Chrome Prompt API) handles structure + plain-language
//      rewriting. Free, private, offline, no page content leaves the machine.
//   2. Cloud model (OpenAI) is ONLY used when the user explicitly taps "ask the
//      smart helper" AND the step is one where being wrong hurts (eligibility,
//      deadlines, legal wording). Nano is not optimized for factual accuracy, so we
//      never trust it for those.
//
// Everything degrades gracefully: if Nano is unavailable, we fall back to template
// text (still useful) and only offer cloud as an explicit choice.

import type { ExtractedPage, AiTier } from '../lib/types';

// Chrome built-in AI global. Typings: npm i -D @types/dom-chromium-ai
declare const LanguageModel: {
  availability(): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
  create(opts?: { temperature?: number; topK?: number }): Promise<{
    prompt(input: string): Promise<string>;
    destroy(): void;
  }>;
};

export interface AiResult {
  text: string;
  tier: AiTier;
}

const READING_LEVEL =
  'Write at a 6th-grade reading level. Short sentences. No jargon. Calm and kind.';

/** Is the local model ready right now? */
export async function localAvailable(): Promise<boolean> {
  try {
    return (await LanguageModel.availability()) === 'available';
  } catch {
    return false;
  }
}

/** Plain-language summary of a confusing page. Tries local first. */
export async function summarizePage(page: ExtractedPage): Promise<AiResult> {
  const prompt = [
    'A person is stuck on this web page and feels overwhelmed.',
    `Title: ${page.title}`,
    `Required fields: ${page.fields.filter((f) => f.required).map((f) => f.label).join(', ') || 'none detected'}`,
    page.deadlines.length ? `Deadlines: ${page.deadlines.join(', ')}` : '',
    page.errors.length ? `Errors showing: ${page.errors.join(', ')}` : '',
    '',
    'In 2 short sentences, say what this page is asking them to do and the one next step.',
    READING_LEVEL,
  ].filter(Boolean).join('\n');

  if (await localAvailable()) {
    const session = await LanguageModel.create({ temperature: 0.3, topK: 3 });
    try {
      return { text: (await session.prompt(prompt)).trim(), tier: 'on_device' };
    } finally {
      session.destroy();
    }
  }
  // Fallback: no model. Caller will use template text instead.
  return { text: '', tier: 'on_device' };
}

/**
 * Escalate to the cloud model. CALLER MUST have explicit user consent for THIS request.
 * The backend proxies the OpenAI call so no key ships in the extension, and the
 * backend strips/forbids anything that isn't the fields we deliberately send.
 */
export async function askCloud(
  prompt: string,
  consentToken: string,
): Promise<AiResult> {
  const res = await fetch('https://api.assetops.pro/lifemode/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-consent': consentToken },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`cloud ai failed: ${res.status}`);
  const data = await res.json();
  return { text: String(data.text ?? '').trim(), tier: 'cloud' };
}
