// Shared types — the contracts that hold the whole system together.
// Page CONTENT is described by these types but never leaves the device.
// Only `AnalyticsEvent` (no PII) is sent to the backend.

/** A single field LifeMode found on a page. */
export interface ExtractedField {
  id: string;
  label: string;            // human-readable, plain language
  kind: 'text' | 'date' | 'select' | 'checkbox' | 'file' | 'ssn' | 'phone' | 'address' | 'unknown';
  required: boolean;
  value?: string;
  options?: string[];       // for selects
  helpText?: string;        // filled in by the AI in plain language
}

/** The structured result of looking at a confusing page. */
export interface ExtractedPage {
  origin: string;           // stored for refresh-persistence (v1 promise kept)
  pathname: string;
  title: string;
  summary?: string;         // plain-language, AI-generated
  fields: ExtractedField[];
  deadlines: string[];      // any dates that look like cutoffs
  errors: string[];         // visible validation/error states
  primaryActionLabel?: string; // text of the main button, if any
}

/** One node in a curated process map. */
export interface TaskStep {
  id: string;
  title: string;            // "File an Intent to File"
  plainExplanation: string; // 6th-grade reading level
  whatYouNeed: string[];    // documents/info required
  doneWhen: string;         // observable completion condition
  humanHelpHint?: string;   // when to route to a person instead
}

/** A versioned map of a real-world process (VA claim, SNAP, housing app...). */
export interface TaskTemplate {
  id: string;               // 'va_disability_claim'
  version: string;          // semver — templates are versioned data
  displayName: string;
  jurisdiction?: string;    // 'US-VA', 'US-UT', etc.
  matchHints: string[];     // origins / keywords used to recognize the page
  steps: TaskStep[];
}

/** What the user has saved, encrypted, to reuse across forms. */
export interface MemoryRecord {
  key: string;              // 'address.street', 'service.branch'
  label: string;
  value: string;
  sensitive: boolean;       // true => extra confirmation before autofill
}

/** The ONLY thing sent to the backend. No content, no PII. */
export interface AnalyticsEvent {
  anonUserHash: string;     // rotating, salted, non-reversible
  templateId: string;
  templateVersion: string;
  stepId: string;
  status: 'started' | 'completed' | 'abandoned' | 'human_help_requested';
  jurisdiction?: string;
  ts: number;
}

/** Where the AI request was served. */
export type AiTier = 'on_device' | 'cloud';
