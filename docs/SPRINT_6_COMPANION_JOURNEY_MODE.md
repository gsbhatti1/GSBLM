# Sprint 6: Companion Journey Mode

## Goal

Make LifeMode feel like a calm companion that walks with the user through a task, not just a scanner.

## Added journeys

- I need to apply for VA disability
- I need to check my claim
- I need to upload evidence
- Help write my description
- I am overwhelmed
- Find a real human

## Important boundary

This is not external AI yet. This is local guided flow.

## Private VA Mode

When LifeMode detects Veteran / VA context, it shows a Private VA Mode banner:

- no VA password storage
- no ID.me login storage
- no SSN storage
- no claim number storage by default
- no external AI call in prototype
- user controls what is copied or written

## Why it matters

A user can type:

```text
I need to apply for VA disability
```

and LifeMode guides them to:

- official VA disability claim page
- official online application intro
- free VSO / accredited representative help
- evidence checklist
- memory note
- VSO handoff

## Product rule

LifeMode helps users express truth clearly. It must never manufacture claims, promise outcomes, suggest ratings, or tell users to exaggerate.