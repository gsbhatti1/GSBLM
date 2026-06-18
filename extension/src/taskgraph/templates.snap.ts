// SNAP (food assistance) template. High-level, not legal advice.
// Curated knowledge is the moat — production versions get partner/caseworker review.

import type { TaskTemplate } from '../lib/types';

export const snapApplication: TaskTemplate = {
  id: 'snap_application',
  version: '0.1.0',
  displayName: 'SNAP food assistance application',
  jurisdiction: 'US',
  matchHints: ['snap', 'food assistance', 'food stamps', 'ebt', 'fns', 'benefits.gov'],
  steps: [
    {
      id: 'check_eligibility',
      title: 'Check if you may qualify',
      plainExplanation:
        'A quick screening shows if you are likely eligible. It takes a few minutes and is not the full application.',
      whatYouNeed: ['Household size', 'Rough monthly income'],
      doneWhen: 'Eligibility screening done',
      humanHelpHint: 'Unsure about income or household size? A caseworker can walk you through it.',
    },
    {
      id: 'gather_documents',
      title: 'Gather your documents',
      plainExplanation:
        'You will need proof of who you are, where you live, and your income. Having these ready makes the rest fast.',
      whatYouNeed: ['Photo ID', 'Proof of address', 'Recent pay or income proof'],
      doneWhen: 'Documents are ready to upload',
    },
    {
      id: 'submit_application',
      title: 'Submit the application',
      plainExplanation: 'Fill in the form and attach your documents. Save as you go if the site lets you.',
      whatYouNeed: ['Documents ready'],
      doneWhen: 'Application submitted confirmation received',
    },
    {
      id: 'interview',
      title: 'Complete your interview',
      plainExplanation:
        'Most applications need a short phone or in-person interview. Watch for a call or letter with the time.',
      whatYouNeed: ['A phone', 'Your application number'],
      doneWhen: 'Interview completed',
      humanHelpHint: 'Missed the interview call? A local office can usually reschedule it.',
    },
  ],
};
