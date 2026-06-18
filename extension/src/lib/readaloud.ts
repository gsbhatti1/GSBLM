// Read-aloud (LM-14). Wraps the Web Speech synthesis API so the panel can speak
// the current step. Kept small and injectable so it can be unit-tested with a mock.

export interface SpeechLike {
  speak(u: SpeechSynthesisUtterance): void;
  cancel(): void;
  speaking: boolean;
}

export function makeReader(synth: SpeechLike | undefined = globalThis.speechSynthesis) {
  return {
    available(): boolean {
      return typeof synth !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
    },
    /** Speak text. Returns true if it started, false if speech is unavailable. */
    speak(text: string): boolean {
      if (!this.available() || !text.trim() || !synth) return false;
      synth.cancel(); // never stack utterances
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; // a touch slower — calmer, easier to follow
      synth.speak(u);
      return true;
    },
    stop(): void {
      synth?.cancel();
    },
    isSpeaking(): boolean {
      return Boolean(synth?.speaking);
    },
  };
}
