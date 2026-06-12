# GSB LifeMode (GSBLM)

> One clear next step when the page feels too heavy.

GSB LifeMode is a browser extension that helps people turn confusing pages, forms, portals, and documents into a calm checklist, a suggested next action, memory support, and human-help routing.

## Core problem

Many people know what they need to do, but the page, form, or process creates too much friction. LifeMode is designed for that moment.

## First wedge

**Form Rescue + One Clear Next Step**

LifeMode starts on the page the user is already stuck on. It does not require a new account or a separate dashboard for the prototype.

## Prototype features

- Direct icon open
- Steps tab
- Companion tab
- Memory tab
- Human Help tab
- Task Portal detection
- Form Rescue
- Reading Mode
- Application Check
- Local human-help router
- Veteran human-help router
- Trusted person handoff
- Read aloud
- Focus mode
- Link badges / task highlights
- Memory notes
- Refresh persistence

## Local install

1. Open Chrome or Edge.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension` folder in this repo.
6. Pin **GSB LifeMode**.
7. Open a confusing page or form.
8. Click the LifeMode icon once.

## Important local demo setting

For local demo files, enable file access:

```text
chrome://extensions
GSB LifeMode
Details
Allow access to file URLs
```

Then test:

```text
demo/task-portal.html
demo/va-claim-check.html
demo/housing-application.html
demo/appointment-prep.html
demo/local-human-help.html
```

## Demo flow

1. Open `https://www.va.gov`.
2. Click the LifeMode icon once.
3. Show Task Portal mode.
4. Show task-link badges.
5. Click **Start first step**.
6. Use **Go** on one checklist item.
7. Open **Companion** and click **Explain this page**.
8. Open **Memory**, write a note, and save it.
9. Open **Human Help** and show local and Veteran support paths.
10. Refresh the page to show LifeMode reopens when it was open.
11. Close with X and refresh to show it stays closed.

## Privacy stance

The prototype runs locally in the browser. It does not use an external AI API yet. Basic notes and preferences are stored in browser local storage.

Refresh persistence stores only:

```text
origin + pathname
```

It does not store page text, form content, query strings, hashes, or documents.

## Build principles

1. Calm before clever.
2. One step beats ten features.
3. Local-first by default.
4. Plain language always.
5. The user owns their tasks and memory.
6. The prototype should work without account creation.
7. No Veteran pays for the bridge back to help.

## Success metric

A user completes a real task that was previously difficult to finish.