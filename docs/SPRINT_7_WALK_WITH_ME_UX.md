# Sprint 7: Walk With Me UX + DD214 Journey

## Goal

Make LifeMode feel like point A to point B guidance instead of a machine extension.

## Default screen

LifeMode opens with:

```text
What are you trying to do today?
```

Choices:

- Apply for VA disability
- Get DD214 / service records
- Check my VA claim
- Upload evidence
- Write what happened
- I am overwhelmed
- I need a human

## DD214 fix

If the user types:

```text
I need DD214
```

LifeMode should route to:

```text
Get DD214 / service records
```

not a generic Companion response.

## DD214 flow

1. Open official VA records page.
2. Choose request method:
   - eVetRecs
   - VA instructions
   - National Archives
   - milConnect
3. Gather only official request information.
4. Submit through official source.
5. Copy records handoff if help is needed.

## Rule

One step per screen. Existing tabs stay behind More tools.

## Privacy

LifeMode should not store SSN, service number, VA login, ID.me login, or claim number.