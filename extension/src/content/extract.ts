// Page extraction — this is the upgrade that kills the hardcoded demos.
// v1 only worked on pages you'd pre-built. This reads ANY page's forms,
// required fields, deadlines, and error states into a structured model.
//
// Runs in the content script. Pure DOM work, no network, no AI yet — fast and private.

import type { ExtractedField, ExtractedPage } from '../lib/types';

function guessKind(el: HTMLInputElement | HTMLSelectElement): ExtractedField['kind'] {
  if (el instanceof HTMLSelectElement) return 'select';
  const t = (el.getAttribute('type') || el.type || '').toLowerCase();
  const name = (el.name + ' ' + el.id + ' ' + (el.getAttribute('autocomplete') || '')).toLowerCase();
  if (t === 'date' || /\bdob\b|birth|date/.test(name)) return 'date';
  if (t === 'checkbox') return 'checkbox';
  if (t === 'file') return 'file';
  if (t === 'tel' || /phone|mobile/.test(name)) return 'phone';
  if (/ssn|social.?security/.test(name)) return 'ssn';
  if (/address|street|city|zip|postal/.test(name)) return 'address';
  if (t === 'text' || t === 'email' || t === '') return 'text';
  return 'unknown';
}

function labelFor(el: Element): string {
  const id = el.getAttribute('id');
  if (id) {
    const esc =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(id)
        : id.replace(/["\\]/g, '\\$&');
    const lab = document.querySelector(`label[for="${esc}"]`);
    if (lab?.textContent) return lab.textContent.trim();
  }
  const wrap = el.closest('label');
  if (wrap?.textContent) return wrap.textContent.trim();
  const aria = el.getAttribute('aria-label') || el.getAttribute('placeholder');
  return (aria || el.getAttribute('name') || 'Field').trim();
}

function extractFields(): ExtractedField[] {
  const els = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      'input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea',
    ),
  );
  return els.slice(0, 80).map((el, i) => ({
    id: el.id || `field_${i}`,
    label: labelFor(el),
    kind: guessKind(el),
    required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
    options:
      el instanceof HTMLSelectElement
        ? Array.from(el.options).map((o) => o.text).slice(0, 20)
        : undefined,
  }));
}

function extractDeadlines(): string[] {
  const text = (document.body.innerText ?? document.body.textContent ?? '').slice(0, 20000);
  const matches = text.match(/\b(?:by|before|due|deadline|expires?)\b[^.\n]{0,60}/gi) || [];
  return Array.from(new Set(matches.map((m) => m.trim()))).slice(0, 5);
}

function extractErrors(): string[] {
  const sels = '[role=alert], .error, .usa-error-message, [aria-invalid=true]';
  return Array.from(document.querySelectorAll(sels))
    .map((e) => (e.textContent || '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function primaryAction(): string | undefined {
  const btn = document.querySelector<HTMLElement>(
    'button[type=submit], input[type=submit], .usa-button:not(.usa-button--unstyled)',
  );
  return (
    btn?.innerText?.trim() ||
    btn?.textContent?.trim() ||
    (btn as HTMLInputElement | null)?.value ||
    undefined
  );
}

export function extractPage(): ExtractedPage {
  return {
    origin: location.origin,
    pathname: location.pathname,
    title: document.title || location.hostname,
    fields: extractFields(),
    deadlines: extractDeadlines(),
    errors: extractErrors(),
    primaryActionLabel: primaryAction(),
  };
}
