import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { HeadContent, Outlet, Scripts, useMatches, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { StrictMode } from 'react'
import { ErrorBoundary, RootErrorFallback } from '@/components/shared/error/ErrorBoundary'
import { Footer } from '@/components/shared/layouts/Footer/Footer'
import { HeaderApp } from '@/components/shared/layouts/Header/HeaderApp/HeaderApp'
import { TailwindResponsiveHelper } from '@/components/shared/layouts/helper/TailwindResponsiveHelper'
import TanStackQueryDevtools from '@/components/shared/providers/tanstack-query/devtools'
import { Provider as TanStackQueryProvider } from '@/components/shared/providers/tanstack-query/root-provider'

const REGION_SLUG_ROUTE_ID = '/regionen/$regionSlug'

export function LayoutRoot() {
  const { queryClient } = useRouteContext({ from: '__root__' })
  const matches = useMatches()
  // Region slug page uses its own HeaderRegionen; skip app chrome to avoid double primary nav.
  const isRegionSlugRoute = matches.some((m) => m.routeId === REGION_SLUG_ROUTE_ID)

  return (
    <html lang="de" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning className="flex min-h-full w-full text-gray-800 antialiased">
        <div className="flex min-h-full w-full flex-col">
          <StrictMode>
            <TanStackQueryProvider queryClient={queryClient}>
              {!isRegionSlugRoute && <HeaderApp />}
              <ErrorBoundary fallback={(props) => <RootErrorFallback {...props} />}>
                <Outlet />
              </ErrorBoundary>
              {!isRegionSlugRoute && <Footer />}
              <TailwindResponsiveHelper />
              <TanStackDevtools
                config={{ position: 'bottom-left' }}
                plugins={[
                  { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
                  { name: 'TanStack Query', render: <TanStackQueryDevtools /> },
                  formDevtoolsPlugin(),
                ]}
              />
            </TanStackQueryProvider>
          </StrictMode>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
