import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import {
  saveMemory,
  loadMemory,
  upsertMemory,
  removeMemory,
  matchMemoryToFields,
} from '../src/lib/memory';
import type { MemoryRecord } from '../src/lib/types';

const rec = (over: Partial<MemoryRecord>): MemoryRecord => ({
  key: 'street',
  label: 'Street address',
  value: '123 Main St',
  sensitive: false,
  ...over,
});

describe('encrypted memory', () => {
  beforeEach(() => store.clear());

  it('round-trips through encryption', async () => {
    await saveMemory([rec({})]);
    const back = await loadMemory();
    expect(back).toHaveLength(1);
    expect(back[0].value).toBe('123 Main St');
  });

  it('stored bytes are not plaintext', async () => {
    await saveMemory([rec({})]);
    const raw = JSON.stringify(store.get('lifemode.memory.v1'));
    expect(raw).not.toContain('123 Main St');
  });

  it('upsert adds then updates by key', async () => {
    await upsertMemory(rec({}));
    let all = await upsertMemory(rec({ value: '456 Oak Ave' }));
    expect(all).toHaveLength(1);
    expect(all[0].value).toBe('456 Oak Ave');
    all = await upsertMemory(rec({ key: 'phone', label: 'Phone', value: '555-1212' }));
    expect(all).toHaveLength(2);
  });

  it('remove deletes by key', async () => {
    await upsertMemory(rec({}));
    const all = await removeMemory('street');
    expect(all).toHaveLength(0);
  });

  it('matchMemoryToFields links saved facts to matching labels', () => {
    const records = [rec({ key: 'street', label: 'Street address' })];
    const matches = matchMemoryToFields(records, ['Street address', 'First name']);
    expect(matches['Street address']?.value).toBe('123 Main St');
    expect(matches['First name']).toBeUndefined();
  });
});
