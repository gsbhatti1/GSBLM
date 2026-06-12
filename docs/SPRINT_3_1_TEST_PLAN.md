# Sprint 3.1 Test Plan

Sprint 3.1 fixes the refresh friction.

## New behavior

If LifeMode is open on a page and the page is refreshed, LifeMode should reopen automatically on that same page.

If the user closes LifeMode with the X button, LifeMode should stop reopening on that page.

## Privacy rule

The extension stores only:

```text
origin + pathname
```

It does not store:

```text
query strings
hashes
page text
form content
document content
```

## Test steps

1. Open `https://www.va.gov`.
2. Click the LifeMode icon.
3. Confirm the panel opens.
4. Refresh the page.
5. Confirm the panel reopens automatically.
6. Click the X button to close LifeMode.
7. Refresh again.
8. Confirm LifeMode stays closed.
9. Click the LifeMode icon again.
10. Confirm it opens normally.

## Test report

```text
Panel reopens after refresh: PASS / FAIL
Close stops reopen: PASS / FAIL
Manual icon open still works: PASS / FAIL
```