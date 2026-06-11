# GSB LifeMode (GSBLM)

> One clear next step when the page feels too heavy.

GSB LifeMode is a browser extension that helps people turn confusing pages, forms, portals, and documents into a calm checklist and a suggested next action.

## Core problem

Many people know what they need to do, but the page, form, or process creates too much friction. LifeMode is designed for that moment.

## First wedge

**Form Rescue + One Clear Next Step**

LifeMode starts on the page the user is already stuck on. It does not require a new account or a separate dashboard for the prototype.

Early task types:

- benefits and public service pages
- housing applications
- job applications
- medical portals
- school forms
- lease and real-estate paperwork
- appointment preparation
- long document checklists

## Prototype features

- Open a calm helper panel on the current page
- Toggle focus mode to reduce page overload
- Detect forms and required fields
- Create a checklist from visible page elements
- Suggest one next step
- Read visible text aloud using browser speech tools
- Copy the checklist
- Save simple preferences locally

## Local install

1. Open Chrome or Edge.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension` folder in this repo.
6. Open a confusing page or form.
7. Click the LifeMode extension button.
8. Press **Open LifeMode**.

## Repo structure

```text
GSBLM/
├─ AGENTS.md
├─ README.md
├─ docs/
│  ├─ FOUNDER_MEMORY.md
│  ├─ PRODUCT_SPEC.md
│  ├─ SAFETY_PRIVACY.md
│  ├─ VALIDATION_PLAN.md
│  └─ ROADMAP.md
└─ extension/
   ├─ manifest.json
   └─ src/
      ├─ content.js
      ├─ lifemode.css
      ├─ popup.html
      ├─ popup.css
      ├─ popup.js
      ├─ options.html
      └─ options.js
```

## Build principles

1. Calm before clever.
2. One step beats ten features.
3. Local-first by default.
4. Plain language always.
5. The user owns their tasks and memory.
6. The prototype should work without account creation.

## Success metric

A user completes a real task that was previously difficult to finish.
