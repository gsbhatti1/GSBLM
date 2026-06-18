import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReader, type SpeechLike } from '../src/lib/readaloud';

// Provide the global constructor jsdom lacks.
class FakeUtterance {
  text: string;
  rate = 1;
  constructor(t: string) {
    this.text = t;
  }
}
vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

function fakeSynth(): SpeechLike & { spoken: string[] } {
  return {
    spoken: [] as string[],
    speaking: false,
    speak(u: SpeechSynthesisUtterance) {
      (this.spoken as string[]).push(u.text);
      this.speaking = true;
    },
    cancel() {
      this.speaking = false;
    },
  };
}

describe('read-aloud', () => {
  let synth: ReturnType<typeof fakeSynth>;
  beforeEach(() => {
    synth = fakeSynth();
  });

  it('reports available when synth + utterance exist', () => {
    expect(makeReader(synth).available()).toBe(true);
  });

  it('speaks text and records it', () => {
    const r = makeReader(synth);
    expect(r.speak('Do this step')).toBe(true);
    expect(synth.spoken).toContain('Do this step');
  });

  it('cancels before speaking so utterances never stack', () => {
    const r = makeReader(synth);
    const spy = vi.spyOn(synth, 'cancel');
    r.speak('one');
    r.speak('two');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('refuses empty text', () => {
    expect(makeReader(synth).speak('   ')).toBe(false);
  });

  it('returns false when synth is unavailable', () => {
    expect(makeReader(undefined).speak('hi')).toBe(false);
  });
});
