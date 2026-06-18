import { describe, it, expect } from 'vitest';
import { listenOnce, voiceAvailable } from '../src/lib/voice';

type Handlers = {
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function fakeCtor(behavior: 'result' | 'denied' | 'nospeech' | 'throw') {
  return class {
    lang = '';
    interimResults = false;
    maxAlternatives = 1;
    onresult: Handlers['onresult'] = null;
    onerror: Handlers['onerror'] = null;
    onend: Handlers['onend'] = null;
    start() {
      if (behavior === 'throw') throw new Error('boom');
      queueMicrotask(() => {
        if (behavior === 'result') {
          this.onresult?.({ results: [[{ transcript: 'how do I file this' }]] });
        } else if (behavior === 'denied') {
          this.onerror?.({ error: 'not-allowed' });
        } else if (behavior === 'nospeech') {
          this.onend?.();
        }
      });
    }
    stop() {}
  } as unknown as new () => never;
}

describe('voice input', () => {
  it('detects availability from a constructor', () => {
    expect(voiceAvailable(fakeCtor('result'))).toBe(true);
    expect(voiceAvailable(undefined)).toBe(false);
  });

  it('returns a transcript on success', async () => {
    const out = await listenOnce(fakeCtor('result'));
    expect(out).toEqual({ ok: true, transcript: 'how do I file this' });
  });

  it('reports denied when the mic is blocked', async () => {
    const out = await listenOnce(fakeCtor('denied'));
    expect(out).toEqual({ ok: false, reason: 'denied' });
  });

  it('reports no-speech when nothing is heard', async () => {
    const out = await listenOnce(fakeCtor('nospeech'));
    expect(out).toEqual({ ok: false, reason: 'no-speech' });
  });

  it('reports unavailable with no constructor', async () => {
    const out = await listenOnce(undefined);
    expect(out).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('handles start() throwing without crashing', async () => {
    const out = await listenOnce(fakeCtor('throw'));
    expect(out).toEqual({ ok: false, reason: 'error' });
  });
});
