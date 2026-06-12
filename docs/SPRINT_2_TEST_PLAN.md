# Sprint 2 Test Plan

## Goal

Make LifeMode feel like a Companion, not just a scanner.

## Test on VA.gov

1. Reload the extension in `chrome://extensions`.
2. Open `https://www.va.gov`.
3. Click the LifeMode icon once.
4. Confirm the Chrome launcher popup does not appear.
5. Confirm the panel opens directly.
6. Confirm the page is detected as Task Portal when enough task links are found.
7. Confirm task links get numbered LifeMode badges.
8. Confirm Go works for title, intro, and task links.

## Test tabs

- Steps tab shows summary, next step, checklist, and Go buttons.
- Companion tab has local buttons:
  - Explain this page
  - Check what Iâ€™m missing
  - What should I do next?
  - Write a plain description
  - Questions for a helper
- Memory tab saves note locally and copies handoff.
- Human Help tab shows support paths.

## Test demo pages

- `demo/va-claim-check.html`
- `demo/housing-application.html`
- `demo/appointment-prep.html`
- `demo/task-portal.html`

## Pass criteria

- Icon direct open: PASS
- Link highlight badges: PASS
- Steps tab: PASS
- Companion local guidance: PASS
- Memory save: PASS
- Copy handoff: PASS
- Human Help routing: PASS
- Demo form Application Check: PASS
