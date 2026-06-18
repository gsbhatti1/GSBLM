# GSB LifeMode v2 — Ticket Backlog

Single source of truth for Claude Code (primary) and Codex (parallel waves).
Finish line: full v1 feature parity + sellable backend analytics. Backend = NEW Supabase project.

Rules for executors:
- Do not skip acceptance criteria. A ticket is DONE only when its checks pass.
- Each ticket names an OWNER agent and its WAVE. Same-wave tickets may run in parallel.
- Every code ticket ships with a test. No test = not done.
- Commit per ticket: `git commit -m "LM-XX: <title>"`.

Legend: [CC]=Claude Code  [CX]=Codex  [HUMAN]=Baldeep manual step

---

## EPIC A — Foundation (must finish before anything else compiles)

### LM-01 [CC] tsconfig + build proves green  · Wave 0
Add `extension/tsconfig.json` (strict, esnext, DOM + chrome types). Install deps.
Accept: `npm install` succeeds; `npm run typecheck` runs (errors expected from missing files, but tsc itself executes).

### LM-02 [CC] Content-script entry  · Wave 0
Create `src/content/index.ts`: listens for a message from the panel, calls `extractPage()`, returns the result. Re-implements v1 refresh-persistence (store origin+pathname only).
Accept: typechecks; manually loadable; logs extracted fields on a test page.

### LM-03 [CC] Service worker  · Wave 0
Create `src/background/worker.ts`: opens side panel on action click, brokers messages between panel and content script, dispatches analytics.
Accept: extension loads in chrome://extensions with no manifest errors.

### LM-04 [CC] Icons + assets  · Wave 0
Add 16/32/48/128px icons, reference in manifest.
Accept: icon shows in toolbar; no missing-asset warning.

### LM-05 [HUMAN] New Supabase project + env  · Wave 0
Create a dedicated LifeMode Supabase project (NOT the AssetOps one). Capture URL + anon key into `backend/.env` and `extension/.env`. Confirm it is separate from `gyjwefhcsbcoudmdxamt`.
Accept: project id recorded in docs; keys never committed.

---

## EPIC B — Core wedge (the thing that must work on any form)

### LM-06 [CC] Harden extract.ts + unit tests  · Wave 1
Add tests for `extractFields/labelFor/guessKind` across 3 saved real-form HTML fixtures (VA, SNAP, a housing portal). Fix label/required detection gaps found.
Accept: tests pass on all 3 fixtures; ≥90% of required fields detected.

### LM-07 [CX] AI router tests + graceful fallback  · Wave 1
Mock `LanguageModel`; test available/unavailable/downloading paths. Ensure empty-summary fallback never throws.
Accept: tests pass for all availability states; no unhandled rejection when Nano absent.

### LM-08 [CX] Task-graph engine tests  · Wave 1
Test `matchTemplate` scoring, `nextStep` selection, `genericSteps` fallback.
Accept: a va.gov fixture matches the VA template; an unknown page yields generic steps.

### LM-09 [CC] Expand template library  · Wave 1
Add SNAP and a generic-housing template alongside the VA one. Move templates to a registry index.
Accept: 3 templates load; each matches its fixture.

### LM-10 [CC] Orchestrator integration test  · Wave 2 (needs 06–09)
End-to-end (jsdom): feed a fixture → assert one clear next step + summary + autofill suggestions.
Accept: integration test green for known + unknown pages.

---

## EPIC C — The screen a tired vet sees (v1 parity)

### LM-11 [CC] panel.html + base layout  · Wave 2
Build the side panel: ONE primary action, big text, calm. Tabs: Steps, Companion, Memory, Human Help (v1 parity).
Accept: panel renders; one primary button; passes axe (no critical a11y violations).

### LM-12 [CC] Steps tab wired to orchestrator  · Wave 3 (needs 10,11)
Show the single next step, "what you need", a "Go" action, mark-done.
Accept: clicking the icon on a real form shows a real next step end-to-end.

### LM-13 [CX] Companion tab ("Explain this page")  · Wave 3
Plain-language explain button → AI router summary; shows AI tier (local/cloud) honestly.
Accept: explain works locally; cloud path gated behind explicit consent tap.

### LM-14 [CX] Read aloud + Focus mode  · Wave 3
Web Speech synthesis for any step/summary; focus mode dims page chrome.
Accept: read-aloud speaks current step; focus toggles; respects reduced-motion.

### LM-15 [CX] Voice input  · Wave 3
Speech-to-text question → routed to AI router. Mic permission handled gracefully.
Accept: spoken question returns a spoken+text answer; denial handled without crash.

### LM-16 [CC] Memory tab + encrypted autofill  · Wave 3 (needs 11)
UI to save facts; offer autofill on matching fields; sensitive fields require per-use confirm.
Accept: save a fact, revisit a form, get an autofill offer; SSN requires confirm.

---

## EPIC D — Human help (the "no vet pays for the bridge" promise)

### LM-17 [CC] Human-Help tab UI  · Wave 3
Local + Veteran support paths, trusted-person handoff (v1 parity).
Accept: tab lists routes; "get me a human" is one tap from any screen.

### LM-18 [CX] Human-help router (backend) + directory schema  · Wave 4
Backend endpoint returns real VSO/local-service contacts by jurisdiction. Seed Utah + national VA.
Accept: GET by jurisdiction returns seeded contacts; falls back to national.

### LM-19 [CC] Trusted-person handoff flow  · Wave 4
Generate a shareable, content-free summary of the current task to send to a trusted person.
Accept: handoff produces a link/text with NO page content or PII.

---

## EPIC E — Backend (the sellable asset) · NEW Supabase project

### LM-20 [CC] Backend scaffold + deploy target  · Wave 2
Vite/Node or Vercel functions under `backend/`. Health endpoint. Wire to new Supabase.
Accept: `/health` returns 200 from local + deployed.

### LM-21 [CC] Supabase schema + migrations (committed)  · Wave 2
Tables: `templates`, `events`, `help_directory`, `consent_log`. RLS on. Migrations committed to repo (do NOT repeat the AssetOps mistake of live-only schema).
Accept: migrations apply cleanly to a fresh project; schema in git.

### LM-22 [CC] Analytics ingest endpoint  · Wave 4 (needs 20,21)
`POST /lifemode/events`: validate shape, reject anything with content/PII fields, store event.
Accept: valid event stored; event carrying page-text field is rejected 400.

### LM-23 [CX] AI proxy endpoint  · Wave 4
`POST /lifemode/ai`: holds OpenAI key server-side, enforces allowlist of fields, requires consent header.
Accept: request without consent → 403; allowed request returns model text; key never exposed.

### LM-24 [CC] Task-graph registry endpoint  · Wave 4
`GET /lifemode/templates`: serve versioned templates so extension updates without re-publish.
Accept: returns the 3 templates with versions; extension can load from it.

### LM-25 [CX] Partner dashboard read API + minimal UI  · Wave 5 (needs 22)
Aggregate completion/abandonment by template/step/jurisdiction. One-screen dashboard.
Accept: dashboard shows completion rate + top abandonment step from seeded events.

---

## EPIC F — Quality gate (no skipping to "done")

### LM-26 [CC] Privacy audit (automated)  · Wave 5
Static + runtime check: assert no network call carries page content/form values/PII. Test the salted-hash rotation.
Accept: audit script passes; documented proof that content never leaves device.

### LM-27 [CX] E2E smoke on 3 real forms  · Wave 5
Playwright: load extension, open 3 real gov forms, confirm a sensible next step appears each time.
Accept: all 3 pass headless; screenshots saved.

### LM-28 [HUMAN+CC] Release checklist + store package  · Wave 6
Versioned build, manifest review, permissions justification, screenshots, privacy copy. Tag v2.0.0.
Accept: `npm run build` produces a loadable zip; checklist signed off.

---

## Definition of Done (every ticket)
1. Code + test committed together. 2. `npm run typecheck` clean. 3. Acceptance checks pass.
4. No page content/PII added to any network path. 5. Commit message `LM-XX: <title>`.
