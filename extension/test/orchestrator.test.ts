import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mock the on-device model: unavailable, so we exercise the template-text fallback path.
vi.stubGlobal('LanguageModel', {
  availability: async () => 'unavailable',
  create: async () => ({ prompt: async () => '', destroy: () => {} }),
});

// Minimal chrome.storage mock so memory + analytics don't throw under jsdom.
const store = new Map<string, unknown>();
vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: async (k: string) => ({ [k]: store.get(k) }),
      set: async (obj: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(obj)) store.set(k, v);
      },
    },
  },
});

import { computeNextStep } from '../src/ui/orchestrator';

function loadFixture(name: string): void {
  document.body.innerHTML = readFileSync(
    join(__dirname, 'fixtures', name),
    'utf8',
  );
}

describe('orchestrator — end to end', () => {
  beforeEach(() => store.clear());

  it('produces one clear next step for a known process (VA)', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://www.va.gov/disability/file-claim'),
      writable: true,
    });
    loadFixture('synthetic-benefits.html');
    const result = await computeNextStep();
    expect(result.matchedKnownProcess).toBe(true);
    expect(result.templateId).toBe('va_disability_claim');
    expect(result.step.title).toBeTruthy();
    expect(result.summary).toBeTruthy();
  });

  it('falls back to a generic step on an unknown page', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://random.example.com/form'),
      writable: true,
    });
    loadFixture('synthetic-benefits.html');
    const result = await computeNextStep();
    expect(result.matchedKnownProcess).toBe(false);
    expect(result.templateId).toBe('generic');
    expect(result.step.title).toBeTruthy();
  });

  it('surfaces autofill suggestions structure (array)', async () => {
    loadFixture('synthetic-benefits.html');
    const result = await computeNextStep();
    expect(Array.isArray(result.autofillSuggestions)).toBe(true);
  });
});
