// Message protocol — the contract between panel, content script, and worker.
// Keeping these in one place stops the three contexts from drifting apart.

import type { ExtractedPage } from './types';

export type PanelToWorker =
  | { type: 'REQUEST_NEXT_STEP' }
  | { type: 'SET_ANALYTICS_CONSENT'; on: boolean };

export type WorkerToContent = { type: 'EXTRACT_PAGE' };

export type ContentToWorker =
  | { type: 'PAGE_EXTRACTED'; page: ExtractedPage }
  | { type: 'EXTRACT_FAILED'; reason: string };

export type WorkerToPanel =
  | { type: 'NEXT_STEP_READY'; page: ExtractedPage }
  | { type: 'NEXT_STEP_FAILED'; reason: string };

export type AnyMessage =
  | PanelToWorker
  | WorkerToContent
  | ContentToWorker
  | WorkerToPanel;
