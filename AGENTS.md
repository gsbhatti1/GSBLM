# AGENTS.md

Operating guide for AI coding agents working on GSB LifeMode.

## Mission

GSB LifeMode helps users turn confusing pages, forms, and documents into a simple checklist and one clear next step.

## First product

Build a Chrome extension called LifeMode.

The extension runs on the current page and opens a calm helper panel.

## Prototype scope

The prototype must support:

- opening a LifeMode panel on the current page
- toggling focus mode
- reading visible text aloud with browser speech tools
- detecting forms and required fields
- creating a checklist from headings, labels, buttons, links, and required fields
- showing one suggested next step
- copying the checklist
- saving simple preferences locally

## Product rules

1. Keep the interface calm.
2. Show one primary action at a time.
3. Use plain language.
4. Keep the first version local-first.
5. Do not send page content to outside services in the prototype.
6. Do not require account creation in the prototype.
7. Do not build a large dashboard before the page overlay works.
8. Do not add features that make the user work harder to use the tool.

## Not first

Do not build these in the first prototype:

- account creation
- payment system
- organization dashboard
- social feed
- complex backend
- general chatbot
- automatic form submission
- external sync

## Tone

Use short, steady interface copy.

Good examples:

- Let's take one step.
- I found the next action.
- Here is the simplest version.
- Copy this checklist.

Avoid copy that blames or pressures the user.

## Privacy rules

The first version should not require a server.

Use browser local storage for settings only.

Before adding any network call, document what data is sent, why it is sent, where it goes, and whether the user can turn it off.

## Accessibility rules

Required interface qualities:

- readable type
- strong contrast
- large click targets
- no flashing UI
- no forced animations
- keyboard-friendly controls
- short sentences
- one primary action at a time

## Suggested repo structure

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

## Code style

Use simple JavaScript, HTML, and CSS for the first prototype.

Prefer no build step until necessary.

Use Manifest V3 for the browser extension.

Keep functions small and clearly named.

Do not introduce a framework until the workflow is proven.

## Development order

1. Extension manifest.
2. Popup with one button: Open LifeMode.
3. Content script that injects a LifeMode panel.
4. CSS for focus mode and the panel.
5. Page scanner for headings, labels, required fields, buttons, and links.
6. Checklist generator.
7. Next-step generator.
8. Read-aloud support.
9. Copy checklist.
10. Local settings.

## Definition of done for prototype

A user can load the extension, visit a page or form, open LifeMode, turn on focus mode, get a simple checklist, see one next step, have text read aloud, copy the checklist, and use the prototype without creating an account.

## Success metric

A user completes a real task that was previously difficult to finish.
