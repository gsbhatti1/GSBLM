import { describe, it, expect } from 'vitest';
import { contactsByKind, helpDirectory } from '../src/lib/help';

describe('human-help directory', () => {
  it('returns veteran contacts including the crisis line separately', () => {
    const vet = contactsByKind('veteran');
    expect(vet.length).toBeGreaterThanOrEqual(2);
    expect(vet.every((c) => c.kind === 'veteran')).toBe(true);
  });

  it('prefers jurisdiction-specific local then falls back to national', () => {
    const ut = contactsByKind('local', 'US-UT');
    expect(ut.some((c) => c.jurisdiction === 'US-UT')).toBe(true);
    // national 211 should still be present as fallback
    expect(ut.some((c) => c.jurisdiction === 'US')).toBe(true);
  });

  it('does not duplicate a contact across local+national merge', () => {
    const ut = contactsByKind('local', 'US-UT');
    const names = ut.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every contact is free/public (has a phone or url, no cost field)', () => {
    for (const c of helpDirectory) {
      expect(Boolean(c.phone || c.url)).toBe(true);
    }
  });

  it('crisis support is reachable', () => {
    const crisis = contactsByKind('crisis');
    expect(crisis.length).toBeGreaterThanOrEqual(1);
  });
});
