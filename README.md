# GSB LifeMode v2 — Platform Skeleton

> One clear next step when the page feels too heavy — now powered by on-device AI,
> a curated task-graph engine, and a privacy-preserving analytics backend you can sell.

This is the v2 architecture skeleton. It keeps every v1 build principle (calm before
clever, local-first, plain language, no account needed to get value) and adds the three
things that turn a prototype into a business.

## What changed from v1

| v1 (current repo) | v2 (this skeleton) |
|---|---|
| Hardcoded demo pages (va-claim, housing, etc.) | General page understanding via on-device AI |
| Raw JS files | TypeScript + Vite + CRXJS bundler |
| Rules-based "portal detection" | Task Graph engine maps any page to a known process |
| Notes in localStorage | Encrypted structured memory (reusable across forms) |
| No external AI | On-device Gemini Nano default; cloud opt-in for hard steps |
| No business model | Free for individuals; paid dashboard/API for orgs |

## The three layers

1. **Free wedge** — the extension. No login, voice-first, runs on the page the user is stuck on.
2. **The moat** — the Task Graph engine (curated maps of real gov/benefits processes) plus a
   privacy-preserving completion-analytics stream. Page *content* never leaves the device;
   only anonymous *events* do.
3. **Revenue** — Partner dashboard (completion analytics for VSOs/counties), co-branded
   deployment, and a Task Graph API other platforms license.

## Who pays

- **Veterans / individuals:** free forever. Distribution + trust + data network effect.
- **VSOs & nonprofits:** dashboard proving abandonment dropped.
- **Counties / agencies:** co-branded deployment inside their portals.
- **Benefits / fintech / health platforms:** license the Task Graph API.

## Repo layout

```
extension/          MV3 + TS + Vite extension (the free wedge)
  src/ai/           AI router: on-device Nano default, cloud opt-in
  src/taskgraph/    Task Graph engine + template types
  src/content/      Page extraction (DOM -> semantic fields)
  src/ui/           Side panel: one clear next step, voice, human help
  src/background/   Service worker, event analytics dispatch
  src/lib/          Encrypted memory, consent, types
backend/            Thin API: task-graph registry, analytics ingest, human-help router
docs/               Architecture + go-to-market notes
```

## Build order (do these in sequence)

1. `extension/src/content/extract.ts` working on any form -> structured fields. (proves the wedge)
2. `extension/src/ai/router.ts` Nano summarize + checklist from extracted fields.
3. `extension/src/taskgraph/` map extracted page onto a versioned template.
4. `extension/src/lib/memory.ts` encrypted reusable facts -> autofill.
5. `backend/` analytics ingest + dashboard read API. (this is what you sell)

See `docs/ARCHITECTURE.md` and `docs/GO-TO-MARKET.md`.
