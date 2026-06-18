// Housing assistance template (Section 8 / public housing style). High-level.

import type { TaskTemplate } from '../lib/types';

export const housingApplication: TaskTemplate = {
  id: 'housing_application',
  version: '0.1.0',
  displayName: 'Housing assistance application',
  jurisdiction: 'US',
  matchHints: ['housing', 'section 8', 'hud', 'public housing', 'housing authority', 'voucher', 'waitlist'],
  steps: [
    {
      id: 'find_open_list',
      title: 'Find an open waiting list',
      plainExplanation:
        'Lists open and close. First make sure the list you want is open right now before you apply.',
      whatYouNeed: ['Your city or county'],
      doneWhen: 'Open waiting list found',
      humanHelpHint: 'Lists all closed? A housing counselor can point you to nearby ones that are open.',
    },
    {
      id: 'pre_application',
      title: 'Fill in the pre-application',
      plainExplanation:
        'This is a short first form to get on the list. It is not the full application yet.',
      whatYouNeed: ['Household members', 'Contact info'],
      doneWhen: 'Pre-application submitted',
    },
    {
      id: 'confirm_waitlist',
      title: 'Confirm you are on the list',
      plainExplanation:
        'Save your confirmation. You may wait a while, so keep your contact info up to date.',
      whatYouNeed: ['Confirmation number or email'],
      doneWhen: 'Waitlist placement confirmed',
    },
    {
      id: 'respond_when_called',
      title: 'Respond when they reach you',
      plainExplanation:
        'When your name comes up they will contact you. Reply quickly — missing it can send you back to the bottom.',
      whatYouNeed: ['A reliable phone or email'],
      doneWhen: 'Responded to the authority',
      humanHelpHint: 'Got a letter you do not understand? Bring it to a housing counselor.',
    },
  ],
};
