# TanStack devtools panel (Query, Router, Form)

**Canonical FMC pattern** for the unified TanStack debug panel. Reference implementation: [trassenscout `TanStackAppDevtools.tsx`](https://github.com/FixMyBerlin/trassenscout/blob/main/src/components/shared/devtools/TanStackAppDevtools.tsx) (see commit `15672e30`).

**Official docs:** [TanStack Devtools](https://tanstack.com/devtools/latest)

---

## Packages (devDependencies)

```json
"@tanstack/devtools-vite": "^0.7.0",
"@tanstack/react-devtools": "^0.10.5",
"@tanstack/react-form-devtools": "^0.2.29",
"@tanstack/react-query-devtools": "^5.101.0",
"@tanstack/react-router-devtools": "^1.167.0"
```

## Vite plugin

Add `@tanstack/devtools-vite` **first** in the `plugins` array. It strips `<TanStackDevtools>` and its panel imports from production builds.

```ts
import { devtools } from '@tanstack/devtools-vite'

export default defineConfig({
  plugins: [
    devtools({
      // react-map-gl spreads all props into map.addSource/addLayer — devtools source attrs break Maplibre validation.
      injectSource: {
        enabled: true,
        ignore: {
          components: ['Source', 'Layer'],
        },
      },
    }),
    // …tanstackStart, viteReact, etc.
  ],
})
```

Skip the `injectSource.ignore` block only when the app has no `react-map-gl` `Source` / `Layer` components.

## Component (`components/shared/devtools/TanStackAppDevtools.tsx`)

Keep devtools in a dedicated component; mount it once from the root layout.

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { ClientOnly } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

/**
 * TanStack devtools panel (Query, Router, Form).
 *
 * - `@tanstack/devtools-vite` strips `<TanStackDevtools>` and its panel imports from
 *   production builds, leaving an empty `<ClientOnly>` — so no devtools ship to prod.
 * - `<ClientOnly>` keeps the panel from rendering during SSR (devtools are a
 *   browser-only overlay), mounting it after hydration.
 *
 * Panels must be referenced inline in `plugins` (not via local wrapper components)
 * so the strip plugin can detect and remove their imports.
 */
export function TanStackAppDevtools() {
  return (
    <ClientOnly fallback={null}>
      <TanStackDevtools
        config={{
          hideUntilHover: false,
          position: 'bottom-left',
          panelLocation: 'bottom',
        }}
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          formDevtoolsPlugin(),
        ]}
      />
    </ClientOnly>
  )
}
```

## Root layout mount

Render inside `QueryClientProvider` in `components/layouts/LayoutRoot.tsx` (or equivalent root layout component):

```tsx
<TanStackQueryProvider queryClient={queryClient}>
  {/* …app shell… */}
  <TanStackAppDevtools />
</TanStackQueryProvider>
```

Do **not** inline `<TanStackDevtools>` in the layout file — colocate in `components/shared/devtools/`.

## Rules (non-negotiable)

| Do                                                         | Don't                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Wrap in `<ClientOnly fallback={null}>`                     | Guard with `if (!import.meta.env.DEV) return null` — rely on `@tanstack/devtools-vite` to strip prod                      |
| Reference panels **inline** in `plugins`                   | Wrap panels in local components (e.g. `RouterDevtoolsPanel` with `useRouter()`) — strip plugin won't remove their imports |
| Use `ReactQueryDevtoolsPanel` inside unified devtools      | Mount standalone `<ReactQueryDevtools />` alongside or instead of the unified panel                                       |
| Use `TanStackRouterDevtoolsPanel` without passing `router` | Pass `router={useRouter()}` — unnecessary; the panel resolves the router from context                                     |
| Add `devtools()` Vite plugin for prod stripping            | Ship devtools behind only a runtime `import.meta.env.DEV` check                                                           |

## Migrating from older FMC layouts

Some apps still inline `<TanStackDevtools>` in `components/layouts/LayoutRoot.tsx` or use a separate `ReactQueryDevtools` wrapper. Replace with the pattern above:

1. Extract `TanStackAppDevtools.tsx` as shown.
2. Switch Query panel to `ReactQueryDevtoolsPanel`.
3. Add `<ClientOnly>`; remove `import.meta.env.DEV` guards.
4. Confirm `@tanstack/devtools-vite` is first in `vite.config` plugins.
