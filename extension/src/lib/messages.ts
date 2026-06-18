// Message protocol — the contract between panel, content script, and worker.
// The content script runs the orchestrator (it lives in the page context where
// DOM extraction and on-device AI are available) and returns a NextStepResult.

import type { ExtractedPage, NextStepResult } from './types';

export type PanelToWorker =
  | { type: 'REQUEST_NEXT_STEP' }
  | { type: 'SET_ANALYTICS_CONSENT'; on: boolean };

export type WorkerToContent = { type: 'COMPUTE_NEXT_STEP' };

export type ContentToWorker =
  | { type: 'NEXT_STEP_RESULT'; result: NextStepResult }
  | { type: 'EXTRACT_FAILED'; reason: string };

export type WorkerToPanel =
  | { type: 'NEXT_STEP_READY'; result: NextStepResult }
  | { type: 'NEXT_STEP_FAILED'; reason: string };

export type AnyMessage =
  | PanelToWorker
  | WorkerToContent
  | ContentToWorker
  | WorkerToPanel;

export type { ExtractedPage, NextStepResult };
