---
name: react-dev
version: 2.0.0
description: >-
  React 19 + TypeScript for FMC TanStack Start apps: typed components, events,
  generics, ref-as-prop, Compiler-first memoization. Use when typing React
  components, hooks, or events — not for routing/server boundaries (see
  tanstack-start-* skills).
---

**LLM reference:** [react.dev/llms.txt](https://react.dev/llms.txt) · [tanstack.com/llms.txt](https://tanstack.com/llms.txt)

# React + TypeScript (FMC)

Type-safe React = compile-time guarantees. This skill covers **TypeScript patterns** agents often get wrong. Behavior, effects, routing, and server I/O live in sibling skills (below).

## When to use

- Typing props, children, refs, event handlers
- Generic/reusable components (`Table<T>`, discriminated unions)
- React 19 APIs (`use()`, ref as prop) — **typing** only
- Reviewing TS in components under `components/`

**Not here:** route loaders, `createServerFn`, SSR, Zustand, Effect discipline → see [Related skills](#related-skills).

## FMC stack (required)

| Requirement        | Rule                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React 19**       | Target 19.x; no `forwardRef` / `useFormState` in new code                                                                                                                                                                                                                                                                                 |
| **React Compiler** | Enabled in the app build — auto-memoization is the default                                                                                                                                                                                                                                                                                |
| **Lint**           | **Oxlint** + React Compiler rules via `eslint-plugin-react-hooks` v7+ as a **jsPlugin** (e.g. namespace `react-hooks-js` — `react-hooks` is reserved in oxlint). See [oxc plugins](https://oxc.rs/docs/guide/usage/linter/plugins.html), preset [oxlint-config-react-hooks-js](https://github.com/eai04191/oxlint-config-react-hooks-js). |
| **Memoization**    | Do **not** add `useMemo` / `useCallback` / `memo` by default; add only when profiling or a lint rule requires it                                                                                                                                                                                                                          |
| **TanStack Start** | Isomorphic by default; server I/O via `createServerFn` in `*.functions.ts` — **no** `'use server'` / `'use client'`                                                                                                                                                                                                                       |
| **Data fetching**  | Route loaders + React Query — not `useEffect` fetch (see `tanstack-start-conventions`)                                                                                                                                                                                                                                                    |

Docs: [React Compiler](https://react.dev/learn/react-compiler.md) · [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks.md) · [Rules of React](https://react.dev/reference/rules.md)

## Related skills

| Topic                                   | Skill                          |
| --------------------------------------- | ------------------------------ |
| Effects, naming, when not to use Effect | `react-useeffect`              |
| Routes, loaders, `validateSearch`, SSR  | `tanstack-start-conventions`   |
| Folder layout, thin routes              | `tanstack-start-app-structure` |
| Next → Start, `createServerFn`          | `tanstack-start-migration`     |
| Client stores                           | `zustand-state-management`     |
| URL state (prefer router search)        | `nuqs`                         |

## Component props

Extend native elements with `ComponentPropsWithoutRef`:

```typescript
type ButtonProps = {
  variant: 'primary' | 'secondary';
} & React.ComponentPropsWithoutRef<'button'>;

function Button({ variant, children, ...props }: ButtonProps) {
  return <button className={variant} {...props}>{children}</button>;
}
```

**Children:** `React.ReactNode` (renderable). Single element: `React.ReactElement`. Avoid `JSX.Element` for `children`.

**Variant props** — discriminated unions:

```typescript
type ButtonProps =
  | { variant: 'link'; href: string }
  | { variant: 'button'; onClick: () => void };

function Button(props: ButtonProps) {
  if (props.variant === 'link') return <a href={props.href}>Link</a>;
  return <button onClick={props.onClick}>Button</button>;
}
```

More: [Using TypeScript](https://react.dev/learn/typescript.md) · [generic-components.md](examples/generic-components.md)

## ref as prop (React 19)

Prefer `ref` as a normal prop — avoid new `forwardRef`:

```typescript
type InputProps = {
  ref?: React.Ref<HTMLInputElement>;
  label: string;
} & React.ComponentPropsWithoutRef<'input'>;

function Input({ ref, label, ...props }: InputProps) {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
    </div>
  );
}
```

Details: [react-19-patterns.md](references/react-19-patterns.md) · [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs.md)

## Event handlers

Use **specific** event types so `currentTarget` is typed:

| Event        | Type                                    |
| ------------ | --------------------------------------- |
| Click        | `React.MouseEvent<HTMLButtonElement>`   |
| Submit       | `React.FormEvent<HTMLFormElement>`      |
| Input change | `React.ChangeEvent<HTMLInputElement>`   |
| Key down     | `React.KeyboardEvent<HTMLInputElement>` |

```typescript
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  const data = new FormData(e.currentTarget)
}
```

Full table + generics: [event-handlers.md](references/event-handlers.md) · [Responding to Events](https://react.dev/learn/responding-to-events.md)

## Hooks (typing only)

| Hook               | Typing note                                                                           |
| ------------------ | ------------------------------------------------------------------------------------- |
| `useState`         | Explicit type for `null` unions, empty arrays, unions: `useState<User \| null>(null)` |
| `useRef`           | DOM: `useRef<HTMLInputElement>(null)` + `?.` — mutable box: `useRef(0)`               |
| `useReducer`       | Discriminated union for `action`                                                      |
| `useContext`       | `createContext<T \| null>(null)` + throw in custom hook                               |
| Custom hook tuples | `return [value, toggle] as const`                                                     |

**Do not** document `useCallback`/`useMemo` defaults here — Compiler handles memoization. Imperative handles / external store: [hooks.md](references/hooks.md).

Effect when/when-not: skill `react-useeffect` · [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect.md)

## Generic components

```typescript
type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

function Table<T>({ data, columns, keyExtractor }: {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
}) {
  /* ... */
}

function List<T extends { id: string | number }>({ items }: { items: T[] }) {
  return <ul>{items.map((item) => <li key={item.id}>…</li>)}</ul>;
}
```

Examples: [generic-components.md](examples/generic-components.md)

## React 19 APIs (pointers)

| API              | Use                                     | Docs                                                                  |
| ---------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `use()`          | Unwrap promise/context (can suspend)    | [use](https://react.dev/reference/react/use.md)                       |
| `useActionState` | Form action state (RSC/Next-style apps) | [useActionState](https://react.dev/reference/react/useActionState.md) |
| `useOptimistic`  | Optimistic UI                           | [useOptimistic](https://react.dev/reference/react/useOptimistic.md)   |
| `useTransition`  | Non-urgent updates                      | [useTransition](https://react.dev/reference/react/useTransition.md)   |
| `useEffectEvent` | Stable callback inside effects          | [useEffectEvent](https://react.dev/reference/react/useEffectEvent.md) |

**FMC mutations:** prefer `createServerFn` + client handlers or React Query — not Next `'use server'` forms. Conceptual RSC background: [Server Components](https://react.dev/reference/rsc/server-components.md) · implementation: `tanstack-start-migration`.

Short TS notes: [react-19-patterns.md](references/react-19-patterns.md)

## Routing (TypeScript only)

Route **behavior** (loaders, Query, `ssr`, `validateSearch`) → `tanstack-start-conventions`.

**Typed route hooks** — pass `from` for inference:

```typescript
const { userId } = Route.useParams() // in createFileRoute component
const { tab } = Route.useSearch()
```

`validateSearch` with Zod is defined on the route file, not in this skill. TS quirks: [tanstack-router.md](references/tanstack-router.md)

## Rules

**Always**

- `ComponentPropsWithoutRef` for native element extension
- Specific `React.*Event<HTMLElement>` types
- Explicit `useState` when inference fails (null, `[]`, unions)
- Discriminated unions for variant props
- `ref` as prop in React 19
- React Compiler on; oxlint with Compiler rules (jsPlugin)
- Server mutations via `createServerFn` in Start apps

**Never**

- `any` on events; `JSX.Element` for `children`
- New `forwardRef` / `useFormState`
- Default `useMemo` / `useCallback` / `memo` without cause
- `'use server'` / `'use client'` in TanStack Start
- `useEffect` for app data fetching (use loaders/Query)
- Await a promise you pass to `use()` for streaming handoff

## References

- [hooks.md](references/hooks.md) — imperative handle, external store typing
- [event-handlers.md](references/event-handlers.md) — extended event type table
- [react-19-patterns.md](references/react-19-patterns.md) — ref-as-prop, `use()` typing notes
- [generic-components.md](examples/generic-components.md) — Table, Select patterns
- [tanstack-router.md](references/tanstack-router.md) — Router TS inference only
