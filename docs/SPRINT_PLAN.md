# LifeMode Demo Sprint Plan

Goal: move from working prototype to demo-ready without drifting into a giant platform.

## Demo target

A person opens a confusing page or form, clicks LifeMode, and sees:

1. page type detection
2. a calm summary
3. one next step
4. a checklist with checkboxes
5. Go buttons that highlight the right page area
6. focus mode
7. read aloud and stop reading
8. copy handoff
9. local memory note

## Parallel workstreams

### Track A: Extension demo

Status: active now.

Build:

- polished overlay
- page type detection
- Form Rescue mode
- Reading Mode
- Page Rescue mode
- checklist checkboxes
- Go-to-step highlighting
- handoff copy
- memory note saved locally

### Track B: Demo proof pages

Build safe test pages so nobody has to use private documents during demos.

Pages:

- demo/test-form.html
- future: demo/long-article.html
- future: demo/appointment-prep.html

### Track C: Product story

Create the demo script and founder story so the product is explainable in 60 seconds.

Files:

- docs/FOUNDER_STORY.md
- docs/DEMO_SCRIPT.md
- README.md

### Track D: Website foundation later

Do not build the website before the extension demo works.

Future site:

- lifemode.gsbkit.com
- landing page
- docs
- privacy
- install guide
- partner page

## Demo-ready definition

The demo is ready when LifeMode can show a real before/after:

Before: user is stuck on a page.

After: user has one next step, a checklist, a memory note, and a copyable handoff.

## Not in this sprint

- accounts
- backend
- payments
- organization dashboard
- external AI calls
- sensitive data sync
- automatic submission

## Sprint rule

Sprint fast, but do not break trust.
