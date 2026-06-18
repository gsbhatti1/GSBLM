# Architecture

## Design constraints (non-negotiable, inherited from v1)

- One primary action on screen at a time.
- Voice in and voice out are equal to tapping.
- No login required to get value.
- ~6th-grade reading level, enforced by the rewrite model.
- "Get me a human" is always one tap and routes to a real person.
- Local-first. Page content never leaves the device without explicit consent.

## The pipeline (what happens when a tired user taps the icon)

```
tap icon
  -> content/extract.ts        read the DOM into a structured ExtractedPage (no network)
  -> ai/router.ts              on-device Nano: plain-language summary + checklist
  -> taskgraph/engine.ts       map page onto a curated TaskTemplate if we know it
  -> lib/memory.ts             offer to autofill known facts (encrypted, on-device)
  -> ui/orchestrator.ts        produce ONE clear next step
  -> lib/analytics.ts          (if consented) send anonymous event, no content
```

## Privacy guarantees, precisely

| Data | Where it lives | Leaves device? |
|---|---|---|
| Page text / form values | Memory, transiently | Never |
| Saved facts (address, etc.) | `chrome.storage.local`, AES-GCM encrypted | Never |
| Refresh-persistence | origin + pathname only | Never |
| Analytics events | — | Only if consented; no PII, salted rotating hash |
| Cloud AI request | — | Only on explicit per-request tap |

## Why on-device + cloud (not one or the other)

Gemini Nano runs locally and free, but is not optimized for factual accuracy and has a
small context window. So we split the work:

- **Nano (local, default):** structure extraction help, plain-language rewriting,
  summarization, "what is this page asking." Wrong-but-harmless if it slips.
- **Cloud (opt-in, hard steps):** eligibility, deadlines, legal wording — anywhere being
  wrong hurts the user. Gated behind an explicit tap and proxied by the backend so no API
  key ships in the extension.

## Why the Task Graph is the moat

Anyone can call an LLM on a page. Almost nobody has a curated, versioned, VSO-reviewed
library of how real government/benefits processes actually work, mapped to the pages users
get stuck on. That curation is slow, domain-heavy, and compounding — exactly what makes it
defensible. The LLM maps onto these maps; it doesn't replace them.

## Backend (thin on purpose)

- **Task-graph registry:** serve/version templates without shipping a new extension.
- **Analytics ingest + dashboard read API:** the saleable product.
- **Human-help router:** directory of real VSOs/local services by jurisdiction.
- **AI proxy:** holds the OpenAI key server-side, enforces that only allowed fields pass.

Reuses the existing Vercel + Supabase stack. Never stores page content.
