# Sprint 3 Test Plan

Sprint 3 adds local human-help routing, clearer task-link badges, stronger Application Check language, and completes refresh persistence.

## What changed

- Human Help now separates:
  - urgent help
  - civilian/local help
  - veteran/military help
  - treatment/support
  - trusted person message
- Local Help lets the user:
  - enter ZIP code or city
  - search ER/hospital
  - search urgent care
  - search community mental health center
  - search free clinic
  - search food/housing help
  - search 211 resources
  - use current location once for nearest ER
- Task Portal link badges are now clearer on the actual page.
- Application Check now gives:
  - Status: Not ready yet / Ready for review
  - missing required fields
  - next field to complete
  - safety reminder for important submissions
- LifeMode reopens after refresh only when it was already open on that page.
- Closing with X stops refresh reopening.

## Test pages

Use:

```text
https://www.va.gov
demo/va-claim-check.html
demo/housing-application.html
demo/local-human-help.html
```

For local files, enable:

```text
chrome://extensions
GSB LifeMode
Details
Allow access to file URLs
```

## Test report

```text
Sprint 3 push: PASS / FAIL
Extension reload: PASS / FAIL
Panel reopens after refresh: PASS / FAIL
Close stops reopen: PASS / FAIL
Human Help split: PASS / FAIL
ZIP local search: PASS / FAIL
Use location once: PASS / FAIL
Clear link badges: PASS / FAIL
Application Check status: PASS / FAIL
Trusted person message: PASS / FAIL
```

## Safety rule

LifeMode is not emergency response. It routes people to real humans and official support paths.