# React useEffect skill

Agent guidance for when to use `useEffect`, when to avoid it, and how to write effects you keep. Based on [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) plus naming discipline and React 19+ APIs.

## For agents

Start with **[SKILL.md](./SKILL.md)**. Load references only when needed:

| File                                   | Use when                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| [anti-patterns.md](./anti-patterns.md) | Reviewing or fixing a specific mistake (derived state, fetch races, effect chains, etc.) |
| [alternatives.md](./alternatives.md)   | Choosing `useMemo`, `key`, `useSyncExternalStore`, `useEffectEvent`, fetch patterns      |

**Live docs:** [react.dev/llms.txt](https://react.dev/llms.txt)

## When to use this skill

- Writing or reviewing `useEffect`, `useEffectEvent`, or effect cleanup
- Derived state, prop-driven resets, parent/child sync, data fetching
- React Compiler / `eslint-plugin-react-hooks` questions around effects
- Naming or splitting effects for readability

**Trigger phrases:** “Should I use useEffect?”, “fix this effect”, “too many re-renders”, “reset state when props change”, “derived state from props”

## Canonical skill

This repo skill includes naming and YMNNE guidance in one place. Prefer it over a separate “named effects only” skill when both apply.
