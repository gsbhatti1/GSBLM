// Template registry index — single import point for all curated templates.
// In production these are served from the backend (LM-24) so the extension
// updates "how a process works" without re-publishing. This bundled set is the
// offline default / fallback.

import type { TaskTemplate } from '../lib/types';
import { vaDisabilityClaim } from './templates.va';
import { snapApplication } from './templates.snap';
import { housingApplication } from './templates.housing';

export const allTemplates: TaskTemplate[] = [
  vaDisabilityClaim,
  snapApplication,
  housingApplication,
];

export { vaDisabilityClaim, snapApplication, housingApplication };
