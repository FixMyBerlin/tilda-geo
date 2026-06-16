import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { HeadContent, Outlet, Scripts, useMatches, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { StrictMode } from 'react'
import { twMerge } from 'tailwind-merge'
import { ErrorBoundary, RootErrorFallback } from '@/components/shared/error/ErrorBoundary'
import { Footer } from '@/components/shared/layouts/Footer/Footer'
import { HeaderApp } from '@/components/shared/layouts/Header/HeaderApp/HeaderApp'
import { TailwindResponsiveHelper } from '@/components/shared/layouts/helper/TailwindResponsiveHelper'
import TanStackQueryDevtools from '@/components/shared/providers/tanstack-query/devtools'
import { Provider as TanStackQueryProvider } from '@/components/shared/providers/tanstack-query/root-provider'

const HIDE_APP_CHROME_ROUTE_IDS = new Set([
  '/regionen/$regionSlug',
  '/preview/region-pending',
  '/preview/region-error',
])

export function LayoutRoot() {
  const { queryClient } = useRouteContext({ from: '__root__' })
  const matches = useMatches()
  // Region slug page uses its own HeaderRegionen; skip app chrome to avoid double primary nav.
  // Region-style preview routes mirror the same full-bleed shell.
  const hideAppChrome = matches.some((m) => HIDE_APP_CHROME_ROUTE_IDS.has(m.routeId))

  return (
    <html lang="de" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className={twMerge(
          'flex w-full bg-white text-gray-800 antialiased',
          // Full-bleed map/preview routes: pin the document to the dynamic viewport and forbid
          // scroll/overscroll so iOS leaves no gray strip and Chrome iOS can't scroll the
          // floating header away. Other routes keep their normal scrollable min-height.
          hideAppChrome ? 'h-dvh overflow-hidden overscroll-none' : 'min-h-dvh',
        )}
      >
        <div className={twMerge('flex w-full flex-col', hideAppChrome ? 'h-dvh' : 'min-h-dvh')}>
          <StrictMode>
            <TanStackQueryProvider queryClient={queryClient}>
              {!hideAppChrome && <HeaderApp />}
              <main className="flex grow flex-col">
                <ErrorBoundary fallback={(props) => <RootErrorFallback {...props} />}>
                  <Outlet />
                </ErrorBoundary>
              </main>
              {!hideAppChrome && <Footer />}
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
