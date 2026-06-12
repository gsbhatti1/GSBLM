# Refresh Persistence Hotfix

This hotfix wires the refresh-persistence functions into the actual panel lifecycle.

## Behavior

- When LifeMode is open and the page refreshes, the panel reopens automatically.
- When the user closes LifeMode with the X button, refresh keeps it closed.
- Manual icon open still works.

## Privacy

The extension stores only:

```text
origin + pathname
```

It does not store page text, form content, query strings, hashes, or documents.

## Test

```text
Panel reopens after refresh: PASS / FAIL
Close stops reopen: PASS / FAIL
Manual icon open still works: PASS / FAIL
```