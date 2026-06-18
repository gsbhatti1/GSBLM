// Example curated template. In production these live in the backend registry and
// are written/reviewed with a VSO partner — that review IS the moat. This one is
// illustrative, not legal advice, and intentionally high-level.

import type { TaskTemplate } from '../lib/types';

export const vaDisabilityClaim: TaskTemplate = {
  id: 'va_disability_claim',
  version: '0.1.0',
  displayName: 'VA disability compensation claim',
  jurisdiction: 'US-VA',
  matchHints: ['va.gov', 'disability', 'compensation', '21-526', 'intent to file'],
  steps: [
    {
      id: 'intent_to_file',
      title: 'File an Intent to File',
      plainExplanation:
        'This locks in your start date. Even if you finish the full claim later, your benefits can be paid back to this date.',
      whatYouNeed: ['Your basic info', 'A few minutes'],
      doneWhen: 'Intent to File confirmation received',
      humanHelpHint: 'If the site will not let you start, a VSO can file this for you.',
    },
    {
      id: 'gather_evidence',
      title: 'Gather your evidence',
      plainExplanation:
        'Collect medical records and anything that shows your condition is connected to your service.',
      whatYouNeed: ['Medical records', 'Service records', 'Any private doctor notes'],
      doneWhen: 'Evidence files are ready to upload',
      humanHelpHint: 'Not sure what counts as evidence? This is a good time to ask a person.',
    },
    {
      id: 'submit_claim',
      title: 'Submit the claim form',
      plainExplanation: 'Fill in the claim and attach your evidence. Take your time.',
      whatYouNeed: ['Intent to File done', 'Evidence ready'],
      doneWhen: 'Claim submitted confirmation received',
    },
    {
      id: 'exam',
      title: 'Go to your exam if asked',
      plainExplanation:
        'The VA may schedule a health exam. Going to it matters — missing it can stop your claim.',
      whatYouNeed: ['Appointment time', 'A way to get there'],
      doneWhen: 'Exam attended',
      humanHelpHint: 'No ride? A local service officer can often help arrange transport.',
    },
  ],
};

export const defaultTemplates = [vaDisabilityClaim];
