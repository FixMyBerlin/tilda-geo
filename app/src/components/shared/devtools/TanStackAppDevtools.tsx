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
