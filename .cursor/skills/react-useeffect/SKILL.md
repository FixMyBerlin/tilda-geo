---
name: react-useeffect
description: React useEffect best practices from official docs and naming discipline. Use when writing/reviewing useEffect, naming effects, useState for derived values, data fetching, or state synchronization. Strong recommendation to name every effect; teaches when NOT to use Effect and better alternatives.
---

# useEffect — naming, scope, and when to skip

Effects are an **escape hatch** from React. They let you synchronize with **external systems**. If there is no external system involved, you usually should not use an Effect.

## Name every useEffect (strong recommendation)

**Always** pass a **named function expression** to `useEffect`, not an anonymous arrow. Treat this as the default style for new and edited code.

```tsx
// Avoid for useEffect (anonymous — hard to skim and debug)
useEffect(() => {
  document.title = `${count} items`;
}, [count]);

// Prefer — intent at the call site; named stacks in errors and DevTools
useEffect(function updateDocumentTitle() {
  document.title = `${count} items`;
}, [count]);
```

Equivalent at a glance: `useEffect(function connectToInventoryWebSocket() { ... }, [warehouseId])` vs `useEffect(() => { ... }, [warehouseId])`.

**Why this matters**

- **Reviews and navigation**: You can skim effect names without reading bodies.
- **Errors and profiling**: Stack traces show `at connectToInventoryWebSocket` instead of `at (anonymous)`; React DevTools shows the same.

**Cleanup**: When teardown is non-trivial, prefer a named cleanup for symmetry and stack clarity:

```tsx
useEffect(function pollServerForUpdates() {
  const intervalId = setInterval(/* ... */, 5000);
  return function stopPollingServer() {
    clearInterval(intervalId);
  };
}, [serverId]);
```

**Other hooks**: The same readability applies wherever you pass a function you did not name — `useCallback`, `useMemo` factories, reducers — but **useEffect** benefits most because timing, dependencies, and cleanup are the hardest to infer.

**Custom hooks**: Still name effects inside the hook; encapsulation does not replace named effects when a hook contains several.

---

## Indicators from naming (what to do next)

Naming is a **design review at the keyboard**. Use it together with [Anti-Patterns](./anti-patterns.md) (examples and fixes live there — avoid duplicating that material here).

| Signal | Meaning | Where to look |
|--------|---------|----------------|
| Name needs **“and”** / **“also”** | Unrelated concerns in one effect | Split into separate effects, each with one name |
| Name like **`syncDerivedValue`**, **`updateStateFromState`**, **`setXBasedOnY`** | Likely derived state or state-to-state sync | [Anti-Patterns §1](./anti-patterns.md#1-redundant-state-for-derived-values) — derive during render; `useMemo` if expensive |
| Name like **`notifyParentOfChange`**, **`reportStateToParent`** | Parent updates driven by child state | [Anti-Patterns §6–7](./anti-patterns.md#6-notifying-parent-via-effect) — event handler, lift data, or controlled pattern |
| Name like **`resetFormOnSubmitFlag`** | User intent expressed via state hop | [Anti-Patterns §4](./anti-patterns.md#4-event-specific-logic-in-effect) — handle in the event handler |
| Clear, **external** verbs: `connectTo…`, `subscribeTo…`, `initialize…`, `synchronize…` (with browser, network, map SDK, etc.) | Often legitimate Effect territory | Still name them; add cleanup when needed |

If the honest name sounds like **internal React bookkeeping**, the code often belongs in render, an event handler, or a different pattern — see the linked sections.

---

## Quick reference

| Situation | DON'T | DO |
|-----------|-------|-----|
| Derived state from props/state | `useState` + `useEffect` | Calculate during render |
| Expensive calculations | `useEffect` to cache | `useMemo` |
| Reset state on prop change | `useEffect` with `setState` | `key` prop |
| User event responses | `useEffect` watching state | Event handler directly |
| Notify parent of changes | `useEffect` calling `onChange` | Call in event handler |
| Fetch data | `useEffect` without cleanup | `useEffect` with cleanup OR framework |

---

## When you DO need Effects

- Synchronizing with **external systems** (non-React widgets, browser APIs)
- **Subscriptions** to external stores (`useSyncExternalStore` when it fits)
- **Analytics/logging** tied to display
- **Data fetching** with proper cleanup (or the framework’s mechanism)

---

## When you DON’T need Effects (pointer)

1. Transforming data for rendering — compute during render
2. User events — event handlers
3. Deriving state — compute it (`const x = f(a, b)`)
4. Chaining updates — do it in one event handler where possible

**Details and fixes**: [Anti-Patterns](./anti-patterns.md). **Alternatives**: [Better Alternatives](./alternatives.md).

---

## Decision tree

```
Need to respond to something?
├── User interaction (click, submit, drag)?
│   └── Use EVENT HANDLER
├── Component appeared on screen?
│   └── Use EFFECT (external sync, analytics)
├── Props/state changed and need derived value?
│   └── CALCULATE DURING RENDER
│       └── Expensive? Use useMemo
└── Need to reset state when prop changes?
    └── Use KEY PROP on component
```

---

## References

- React — [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- Neciu Dan — [Start naming your useEffect functions](https://neciudan.dev/name-your-effects) (naming discipline, splitting when names resist, overlap with “you might not need an effect”)
- Kyle Shevlin — [useEncapsulation](https://kyleshevlin.com/use-encapsulation/) (custom hooks; still name effects inside hooks)
