// Encrypted reusable memory.
//
// The single highest-value feature for the veteran/benefits use case: the SAME
// facts (address, service dates, dependents) get typed into 20 different portals.
// Store them once, encrypted, on-device. Offer to autofill. Sensitive fields
// (SSN, etc.) always require an explicit per-use confirmation.
//
// Encryption: AES-GCM via Web Crypto. Key is derived from a user passphrase OR
// kept in extension storage for the no-login path (still better than plaintext;
// upgrade to passphrase when the user opts into sensitive storage).

import type { MemoryRecord } from './types';

const STORE_KEY = 'lifemode.memory.v1';

async function getKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.local.get('lifemode.k');
  let raw = stored['lifemode.k'] as number[] | undefined;
  if (!raw) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    raw = Array.from(bytes);
    await chrome.storage.local.set({ 'lifemode.k': raw });
  }
  return crypto.subtle.importKey('raw', new Uint8Array(raw), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function saveMemory(records: MemoryRecord[]): Promise<void> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(records));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  await chrome.storage.local.set({
    [STORE_KEY]: { iv: Array.from(iv), cipher: Array.from(new Uint8Array(cipher)) },
  });
}

export async function loadMemory(): Promise<MemoryRecord[]> {
  const key = await getKey();
  const stored = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] as
    | { iv: number[]; cipher: number[] }
    | undefined;
  if (!stored) return [];
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(stored.iv) },
      key,
      new Uint8Array(stored.cipher),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as MemoryRecord[];
  } catch {
    return [];
  }
}

/** Suggest autofill values for a page's fields from saved memory. */
export function matchMemoryToFields(
  records: MemoryRecord[],
  fieldLabels: string[],
): Record<string, MemoryRecord> {
  const out: Record<string, MemoryRecord> = {};
  for (const label of fieldLabels) {
    const l = label.toLowerCase();
    const hit = records.find(
      (r) => l.includes(r.key.split('.').pop() || '') || r.label.toLowerCase() === l,
    );
    if (hit) out[label] = hit; // sensitive ones still need confirmation at fill time
  }
  return out;
}
