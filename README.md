# GSB LifeMode v2

> One clear next step when the page feels too heavy.

GSB LifeMode is a browser extension that helps people turn confusing pages,
forms, portals, and documents into a calm checklist, a suggested next action,
memory support, and human-help routing.

The v2 architecture keeps the original build principles: calm before clever,
local-first by default, plain language, and no account required to get value.
It adds on-device AI routing, a curated task-graph engine, and a
privacy-preserving analytics backend.

## What Changed From v1

| v1 prototype | v2 platform |
| --- | --- |
| Hardcoded demo pages | General page understanding via on-device AI |
| Raw JavaScript files | TypeScript + Vite + CRXJS bundler |
| Rules-based portal detection | Task Graph engine maps pages to known processes |
| Notes in localStorage | Encrypted structured memory for reuse across forms |
| No external AI | On-device Gemini Nano default; cloud opt-in for hard steps |
| No business model | Free extension plus paid dashboard/API for organizations |

## Repo Layout

```text
extension/          MV3 + TypeScript + Vite extension
  src/ai/           AI router: on-device Nano default, cloud opt-in
  src/taskgraph/    Task Graph engine + template types
  src/content/      Page extraction
  src/ui/           Side panel: one clear next step, voice, human help
  src/background/   Service worker, event analytics dispatch
  src/lib/          Encrypted memory, consent, types
backend/            Thin API: registry, analytics ingest, dashboard
demo/               Static demo pages
docs/               Architecture, sprint, and go-to-market notes
```

## Prototype Features

- Direct icon open
- Steps tab
- Companion tab
- Memory tab
- Human Help tab
- Task Portal detection
- Form Rescue
- Reading Mode
- Application Check
- Local and Veteran human-help routing
- Trusted person handoff
- Read aloud
- Focus mode
- Link badges / task highlights
- Refresh persistence

## Local Install

1. Open Chrome or Edge.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the built extension output from `extension/dist`.
6. Pin **GSB LifeMode**.
7. Open a confusing page or form.
8. Click the LifeMode icon once.

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

## Build And Test

```bash
cd extension
npm ci
npm run build
```

```bash
cd backend
npm ci
npm run typecheck
npm test
```

## Vercel Deployment

The backend is the Vercel-deployable app. Configure the Vercel project with:

- Production branch: `master`
- Root Directory: `backend`
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`

The backend exposes API routes from `backend/api/*` and serves static files from
`backend/public/*`.

## Privacy Stance

Page content stays local by default. Backend analytics accepts anonymous event
metadata only and rejects payloads with page text, field values, or PII-shaped
keys.

Refresh persistence stores only:

```text
origin + pathname
```

It does not store page text, form content, query strings, hashes, or documents.

## Build Principles

1. Calm before clever.
2. One step beats ten features.
3. Local-first by default.
4. Plain language always.
5. The user owns their tasks and memory.
6. The prototype should work without account creation.
7. No Veteran pays for the bridge back to help.

## Success Metric

A user completes a real task that was previously difficult to finish.
