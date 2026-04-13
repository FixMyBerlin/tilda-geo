# Server Functions (TanStack Start)

## createServerFn

Server functions run on the server and are called from the client like async functions. They replace Next.js Server Actions.

**Definition:** Use `.inputValidator()` (not `.validator()`); the client receives a function that expects `{ data: T }`.

```tsx
import { createServerFn } from '@tanstack/start';

export const updateName = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string }) => {
    if (typeof data.name !== 'string' || data.name.length < 2) throw new Error('Invalid name');
    return data;
  })
  .handler(async ({ data }) => {
    await db.user.update({ where: { id: currentUser.id }, data: { name: data.name } });
    return { ok: true };
  });
```

**From client:**

```tsx
'use client';
import { updateName } from './profile.server';

await updateName({ data: { name: 'Jane' } });
```

- **method:** Use `'POST'` for mutations. Omit or use GET only for idempotent reads.
- **validator:** Runs on server (and can run on client for optimistic validation). Throw or return validated payload; handler receives `{ data }`.
- **handler:** Async; receives `{ data }` from validator. Run DB, external APIs, etc. Return serializable value.

## File Convention

Keep server-only code out of client bundle: put server functions in `*.server.ts` or under `server/`. Import only the function reference in client code; implementation stays on server.

## Validation (Zod)

```tsx
import { z } from 'zod';

const schema = z.object({ name: z.string().min(2), email: z.string().email() });

export const submitForm = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    // data: { name: string; email: string }
  });
```

## Errors

- Throw in handler → client receives error. Use `try/catch` at call site and/or global error boundary.
- For validation errors, throw a structured error (e.g. `ValidationError`) so client can show field-level messages.

## Invalidation After Mutations

After a server function that changes data used by a route loader, invalidate so the loader re-runs:

- **TanStack Router:** `router.invalidate()` or invalidate specific route/loader.
- **React Query:** `queryClient.invalidateQueries({ queryKey: ['users'] })` if loaders use the same query key.

Call invalidation after `await serverFn(...)` in the same event handler.

## No formAction

Next.js `formAction={action}` does not exist. Use:

- `onSubmit` that calls the server function and then invalidates or redirects.
- Optional: `useTransition` or local state for `isPending` to disable submit or show loading.

## Multiple Arguments

Validator can accept a single payload; for multiple args, pass an object:

```tsx
export const updateItem = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string; name: string }) => input)
  .handler(async ({ data }) => { ... });
```

Call: `updateItem({ data: { id: '1', name: 'Foo' } })`.
