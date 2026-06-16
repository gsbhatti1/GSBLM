# LifeMode Wayfinder ("the corpsman")

Get a person from **A (lost)** to **B (the exact official place)** fast — plus
the one thing nobody told them. Sometimes B is "you don't have to go at all."

## Core principle: resolve, don't hardcode

There is **no hardcoded directory of destinations.** Links rot (TRICARE West
moved contractors on Jan 1, 2025 and every old link died). Instead the wayfinder
**resolves intent live** through a grounded server call and returns the current
official destination, the clicks to get there, and a "field note" — the
trip-killer fact most people don't know.

## The two things that ARE hardcoded — on purpose

These are safety, not laziness:

1. **The crisis net** (`988`, then Press 1; Veterans Crisis Line; text 838255).
   Local, deterministic, runs *before* anything else, every time. It never
   depends on the network or the model. See `isCrisis()` in `wayfinder.js`.
2. **The official-domain allowlist** (`va.gov`, `*.mil`, `archives.gov`, …).
   Not destinations — just the official roofs. The resolver may return any
   destination, but the server **rejects any URL not under an official domain**
   and routes to a human instead. This stops a hallucinated or lookalike link
   from ever reaching a vet.

## Data flow

```
person types plain words
   │
   ▼
[client] isCrisis()?  ── yes ──►  hardcoded 988 / Veterans Crisis Line (no network)
   │ no
   ▼
POST { query }  ──►  [server /api/wayfinder]
                       • grounded resolve (no local directory)
                       • validate URL against official-domain allowlist
                       • generate field note (no claim advice)
                       • low confidence / bad domain ──► human fallback
   │
   ▼
[client] render: destination + clicks + field note + Take me there
                 (always-present "Reach a human" bar never leaves the screen)
```

## Privacy

Only the **intent text** leaves the device (max 300 chars). Never page contents,
never form answers, never SSN / claim number / DOB. Reuses the same
structure-only discipline as `buildPageModel()`.

## Failure is never a dead end

Timeout, error, unknown intent, or an unverifiable URL all resolve to the same
place: a free VA-accredited rep. The tool never strands someone.

## Install wiring

- Set the resolver endpoint: `window.LIFEMODE_RESOLVER_URL = "https://<your-app>.vercel.app/api/wayfinder"`.
- Add that origin to `host_permissions` in `manifest.json`.
- Deploy `server/api/wayfinder/route.ts` to your Next.js app on Vercel and set
  `ANTHROPIC_API_KEY` (and optional Upstash vars) in the Vercel project.
