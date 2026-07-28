# Server Functions (TanStack Start)

Server functions run on the server and are callable from routes and components like async functions.

**Official docs:** [Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)

**Related:** [execution-model.md](execution-model.md) · [client-server-boundaries.md](client-server-boundaries.md) (file suffixes) · `tanstack-start-auth` (auth inside handlers)

---

## createServerFn

**Isomorphic behavior:** On the server, the handler runs directly. On the client (e.g. loader during soft nav), the call becomes a typed RPC request.

**Definition:** Use `.validator()`; the client receives a function that expects `{ data: T }`.

```tsx
import { createServerFn } from '@tanstack/react-start'

export const updateNameFn = createServerFn({ method: 'POST' })
  .validator((data: { name: string }) => {
    if (typeof data.name !== 'string' || data.name.length < 2) throw new Error('Invalid name')
    return data
  })
  .handler(async ({ data }) => {
    await db.user.update({ where: { id: currentUser.id }, data: { name: data.name } })
    return { ok: true }
  })
```

**From client or route:**

```tsx
import { updateNameFn } from '@/server/profile/profile.functions'

await updateNameFn({ data: { name: 'Jane' } })
```

- **method:** `'POST'` for mutations; `'GET'` (or omit) for idempotent reads.
- **validator:** Validate before handler; handler receives `{ data }`.
- **handler:** Async; DB, external APIs, fs. Return serializable value.

## FMC file conventions

| Suffix           | Purpose                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `*.server.ts`    | Server-only modules; use `createServerOnlyFn` for exports — **never** imported by routes/components |
| `*.functions.ts` | `createServerFn` exports (`*Fn` naming); imported by routes and components                          |

Example layout:

```
server/profile/
├── queries/getProfile.server.ts
├── mutations/updateProfile.server.ts
└── profile.functions.ts    # updateProfileFn, getProfileFn
```

Route files call server fns in `loader` / `beforeLoad` — not direct `*.server.ts` imports.

## Validation (Zod)

```tsx
import { z } from 'zod'

const schema = z.object({ name: z.string().min(2), email: z.string().email() })

export const submitFormFn = createServerFn({ method: 'POST' })
  .validator(schema)
  .handler(async ({ data }) => {
    // data: { name: string; email: string }
  })
```

## Form submit (no formAction)

Use `onSubmit` → server fn → invalidate/redirect. Optional `useTransition` for pending state.

```tsx
import { useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { updateNameFn } from '@/server/profile/profile.functions'

function ProfileForm() {
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = String(formData.get('name') ?? '')
    startTransition(async () => {
      await updateNameFn({ data: { name } })
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        Save
      </button>
    </form>
  )
}
```

## Errors

- Throw in handler → client receives error. Use `try/catch` at call site and/or route `errorComponent`.
- For validation errors, throw structured errors for field-level UI.

## Invalidation after mutations

After a mutation that changes loader/Query data:

- **React Query:** `queryClient.invalidateQueries({ queryKey: [...] })`
- **Router:** `router.invalidate()` for loader-only routes

Call invalidation after `await serverFn(...)` in the same event handler.

## Auth note

Route `beforeLoad` protects the page UX; it does **not** stop direct RPC to a server function. Apply auth checks inside every server function handler that needs it. See `tanstack-start-auth`.

## Multiple arguments

Pass a single object via validator:

```tsx
export const updateItemFn = createServerFn({ method: 'POST' })
  .validator((input: { id: string; name: string }) => input)
  .handler(async ({ data }) => { ... })
```

Call: `updateItemFn({ data: { id: '1', name: 'Foo' } })`.
