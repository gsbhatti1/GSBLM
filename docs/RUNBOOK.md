# Execution Runbook — how to actually run the waves

Two agents. Claude Code (CC) is primary and owns anything touching the build,
integration, schema, and the privacy gate. Codex (CX) takes self-contained parallel
tickets inside a wave. You (Baldeep) run the commands; the agents do the work.

A wave is DONE when every ticket in it passes its acceptance checks AND
`cd extension && npm run typecheck` is clean. Do not start the next wave early.

---

## One-time setup

```bash
cd C:\Users\gsbha
git clone https://github.com/gsbhatti1/GSBLM.git GSBLM-v2
cd GSBLM-v2
git checkout -b v2-rebuild
# unzip the skeleton so extension/ backend/ docs/ exist, then:
cd extension && npm install && cd ..
git add -A && git commit -m "chore: import v2 skeleton + backlog"
```

Open Claude Code in `C:\Users\gsbha\GSBLM-v2`. Keep `docs/TICKETS.md` as the brief.

---

## Wave 0 — Foundation  (CC serial, LM-05 is you)

Claude Code, one prompt:
```
Read docs/TICKETS.md. Do LM-01, LM-02, LM-03, LM-04 in order.
After each, run `cd extension && npm run typecheck` and report. Commit each as "LM-0X: <title>".
Stop after LM-04 and list anything you could not finish.
```
You do LM-05 (new Supabase project). Paste URL + anon key when asked; never commit them.

Gate: extension loads in chrome://extensions with zero manifest errors.

---

## Wave 1 — Core wedge + backend scaffold  (CC + CX in parallel)

Claude Code:
```
Do LM-06 and LM-09 from docs/TICKETS.md. Save the 3 real-form HTML fixtures under
extension/test/fixtures/. Write Vitest tests. Then LM-20 and LM-21 — backend scaffold +
committed Supabase migrations against the new project. Run tests + typecheck, commit each.
```
Codex (separate branch `cx/wave1`, or worktree):
```
Do LM-07 and LM-08 from docs/TICKETS.md. Mock the LanguageModel global. Vitest only,
no source API changes beyond what the tickets specify. Commit each as "LM-0X: ...".
```
Merge Codex branch when green. Gate: all Wave 1 tests pass; migrations apply to a fresh DB.

---

## Wave 2 — Integration + panel shell  (CC)

```
Do LM-10 (jsdom integration test through the orchestrator) and LM-11 (panel.html base
layout: one primary action, Steps/Companion/Memory/Human Help tabs, axe-clean).
Commit each. Confirm clicking the toolbar icon opens the panel.
```
Gate: integration test green; panel renders; no critical axe violations.

---

## Wave 3 — v1 parity surface  (CC + CX heavy parallel)

Claude Code (owns anything wiring to orchestrator/memory):
```
Do LM-12 (steps tab end-to-end), LM-16 (memory + encrypted autofill), LM-17 (human-help UI).
```
Codex (`cx/wave3`):
```
Do LM-13 (companion explain), LM-14 (read-aloud + focus mode), LM-15 (voice input).
Use Web Speech APIs; handle permission denial without crashing. Vitest where possible.
```
Gate: open a real form → real next step shows; read-aloud speaks; voice answers; autofill offers; "get me a human" is one tap.

---

## Wave 4 — Backend endpoints + handoff  (CC + CX)

Claude Code:
```
Do LM-19 (content-free trusted-person handoff), LM-22 (analytics ingest that REJECTS any
content/PII field), LM-24 (versioned templates registry endpoint). Tests + commit each.
```
Codex (`cx/wave4`):
```
Do LM-18 (human-help router + seed Utah + national VA) and LM-23 (AI proxy: consent header
required, OpenAI key server-side only, field allowlist enforced). Tests + commit each.
```
Gate: ingest rejects a content-bearing event 400; AI proxy 403s without consent; help router returns seeded contacts.

---

## Wave 5 — Dashboard + quality gate  (CC + CX)

Claude Code:
```
Do LM-26: automated privacy audit. Script asserts no network path carries page content,
form values, or PII, and verifies the salted hash rotates daily. Fail the build if violated.
```
Codex (`cx/wave5`):
```
Do LM-25 (partner dashboard read API + one-screen UI showing completion + top abandonment
step) and LM-27 (Playwright E2E on 3 real forms, save screenshots).
```
Gate: dashboard shows real numbers from seeded events; privacy audit passes; 3 E2E forms pass headless.

---

## Wave 6 — Release  (you + CC)

```
Do LM-28: production build, manifest + permissions review, screenshots, privacy copy.
Produce a loadable zip. Tag v2.0.0.
```
Gate: `npm run build` yields a loadable package; checklist signed off; tag pushed.

---

## Standing rules for both agents (paste into each session)

- Source of truth is docs/TICKETS.md. Do not invent scope.
- Every code change ships with a test. No test, not done.
- Never put page content, form values, or PII on any network path.
- New Supabase project only — never touch AssetOps (gyjwefhcsbcoudmdxamt).
- Keys live in .env, never in git.
- After each ticket: typecheck, run tests, commit "LM-XX: <title>", report blockers honestly.
```
