# Sprint 6 Journey Button Hotfix

## Problem

Sprint 6 added the Companion journey UI, but some visible buttons were not wired to click actions.

## Fix approach

This hotfix uses delegated click handling inside the LifeMode panel instead of brittle exact-button listeners. It catches both current and future journey buttons.

## Fixed

- Ask Companion button
- Journey buttons
- Dynamic action buttons inside Companion responses
- Evidence checklist action
- Open Memory action
- Copy VSO handoff action
- Overwhelmed route actions
- Find human route actions
- Private VA Mode update during scan
- Memory description path now opens Memory when no note exists

## Test

```text
Hotfix push: PASS / FAIL
Extension reload: PASS / FAIL
Ask Companion button: PASS / FAIL
Journey buttons: PASS / FAIL
Evidence checklist action: PASS / FAIL
Open Memory action: PASS / FAIL
Copy VSO handoff action: PASS / FAIL
Overwhelmed route actions: PASS / FAIL
Find human route actions: PASS / FAIL
Memory description path: PASS / FAIL
```