# GSB LifeMode Blueprint

This document keeps the build sequence clear so the project does not drift.

## North star

LifeMode turns confusing pages, forms, portals, and documents into a calm checklist and one clear next step.

## Build pipeline

### Phase 1: LifeMode Chrome Extension

Build the tool where the user is already stuck: inside the current webpage.

Files:

```text
extension/
├─ manifest.json
└─ src/
   ├─ popup.html
   ├─ popup.css
   ├─ popup.js
   ├─ content.js
   ├─ lifemode.css
   ├─ options.html
   └─ options.js
```

Phase 1 goals:

- Open a calm LifeMode panel on any page.
- Toggle focus mode.
- Scan headings, links, buttons, labels, forms, and required fields.
- Generate a checklist.
- Suggest one next step.
- Read text aloud.
- Copy the checklist.
- Save preferences locally.

Phase 1 rule:

> No backend. No account. No dashboard. Prove the page overlay first.

### Phase 2: lifemode.gsbkit.com

Build the public website after the extension prototype works.

Site sections:

```text
lifemode.gsbkit.com
├─ landing page
├─ product docs
├─ privacy page
├─ install guide
├─ partner page
├─ veteran, TBI, ADHD, and cognitive accessibility resource pages
└─ future organization dashboard entry point
```

Phase 2 goals:

- Explain the product clearly.
- Help users install the extension.
- Publish privacy and safety commitments.
- Give partners a place to understand the mission.
- Document how the extension works.

Suggested stack later:

- Astro for content and docs
- Tailwind for styling if needed
- TypeScript when the app grows
- Edge functions only when a server is truly needed
- Database only after there is a real saved-data workflow

Phase 2 rule:

> The website supports the product. It must not replace the product.

### Phase 3: Trusted daily-life memory layer

Add optional saved workflows after trust is earned.

Possible features:

- private task binder
- document checklist vault
- saved accommodation preferences
- caregiver or trusted helper sharing
- reminders
- local resource routing

Phase 3 rule:

> The user controls what is saved and what is shared.

### Phase 4: Partner and organization layer

Only build this after individual users prove the workflow.

Possible customers:

- nonprofits
- clinics
- veteran organizations
- housing providers
- schools
- employers
- accessibility teams

Possible features:

- partner landing pages
- install links
- custom workflows
- non-sensitive analytics
- training material
- accessibility reports

Phase 4 rule:

> Partners pay for better support, but the individual user must stay protected.

## What to avoid

Do not start with:

- a large dashboard
- a social network
- a chatbot-first product
- a database-first product
- a website-first product
- too many brands
- features that require trust before trust is earned

## Current next step

Build the Phase 1 extension skeleton and make it load locally in Chrome.
