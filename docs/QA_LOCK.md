# QA Lock

## Demo build

`v0.4.0-demo`

## Mission line

No one should be left alone with the page that breaks them.

## Locked behaviors

These behaviors must remain working before any new sprint is accepted:

- icon opens LifeMode directly
- no launcher popup
- Steps tab opens
- Companion tab opens
- Memory tab opens
- Human Help tab opens
- checklist renders
- Go highlights page target
- task link badges appear
- Memory note saves
- Copy handoff works
- Trusted person message works
- Read aloud works
- Stop reading works
- ZIP local search opens maps
- Use location once asks permission
- refresh reopens LifeMode if it was open
- close with X stops refresh reopen

## Regression rule

If any locked behavior fails, pause new features and fix the regression first.

## Manual QA report

```text
Direct icon open:
Tabs:
Checklist:
Go highlight:
Link badges:
Companion:
Memory:
Human Help:
ZIP local search:
Use location once:
Read aloud:
Copy handoff:
Refresh reopen:
Close stops reopen:
```
