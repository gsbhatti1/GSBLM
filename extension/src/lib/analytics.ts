// Analytics — the thing you actually sell, built to never betray the privacy stance.
//
// We send EVENTS, not content: "template=va_disability, step=evidence, status=completed".
// The user hash is salted + rotating so it can't be tied back to a person across time.
// Page text, form values, query strings, and documents are NEVER sent.
//
// This stream is what powers the Partner dashboard a county pays for: completion
// rates, abandonment points, time-to-finish — the metrics they currently can't see.

import type { AnalyticsEvent } from './types';
import { backendUrl } from './config';

/** Salted, rotating, non-reversible per-install id. Rotates daily. */
async function anonUserHash(): Promise<string> {
  const day = Math.floor(Date.now() / 86_400_000);
  const stored = await chrome.storage.local.get('lifemode.salt');
  let salt = stored['lifemode.salt'] as string | undefined;
  if (!salt) {
    salt = crypto.randomUUID();
    await chrome.storage.local.set({ 'lifemode.salt': salt });
  }
  const bytes = new TextEncoder().encode(`${salt}:${day}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

let consented = false;
/** Org/individual must opt in to anonymous analytics. Default off. */
export function setAnalyticsConsent(on: boolean): void {
  consented = on;
}

export async function trackEvent(
  e: Omit<AnalyticsEvent, 'anonUserHash' | 'ts'>,
): Promise<void> {
  if (!consented) return;
  const url = backendUrl('/events');
  if (!url) return; // backend not configured yet — stay local-first
  const event: AnalyticsEvent = {
    ...e,
    anonUserHash: await anonUserHash(),
    ts: Date.now(),
  };
  // Fire-and-forget; never block the user's task on telemetry.
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    /* offline-first: drop silently, the user's task is what matters */
  }
}
