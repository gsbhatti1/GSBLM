// Voice input (LM-15). Wraps Web Speech recognition so the panel can capture a
// spoken question. Kept injectable so it can be unit-tested with a fake recognizer.
//
// Browser support is uneven and the constructor is vendor-prefixed, so everything
// degrades gracefully: if recognition is missing or the mic is denied, the caller
// gets a clear, non-crashing result.

export type VoiceOutcome =
  | { ok: true; transcript: string }
  | { ok: false; reason: 'unavailable' | 'denied' | 'no-speech' | 'error' };

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | undefined {
  const g = globalThis as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return g.SpeechRecognition ?? g.webkitSpeechRecognition;
}

export function voiceAvailable(ctor = getCtor()): boolean {
  return typeof ctor === 'function';
}

/** Listen once and resolve with a transcript or a clear failure reason. */
export function listenOnce(ctor = getCtor()): Promise<VoiceOutcome> {
  return new Promise((resolve) => {
    if (!ctor) return resolve({ ok: false, reason: 'unavailable' });
    let settled = false;
    const rec = new ctor();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      if (settled) return;
      settled = true;
      const transcript = e.results?.[0]?.[0]?.transcript ?? '';
      resolve(
        transcript.trim()
          ? { ok: true, transcript: transcript.trim() }
          : { ok: false, reason: 'no-speech' },
      );
    };
    rec.onerror = (e) => {
      if (settled) return;
      settled = true;
      const denied = e.error === 'not-allowed' || e.error === 'service-not-allowed';
      resolve({ ok: false, reason: denied ? 'denied' : 'error' });
    };
    rec.onend = () => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, reason: 'no-speech' });
    };

    try {
      rec.start();
    } catch {
      if (!settled) {
        settled = true;
        resolve({ ok: false, reason: 'error' });
      }
    }
  });
}
