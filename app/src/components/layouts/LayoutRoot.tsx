import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { HeadContent, Outlet, Scripts, useMatches, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { StrictMode } from 'react'
import { twJoin } from 'tailwind-merge'
import { Footer } from '@/components/layouts/Footer/Footer'
import { HeaderApp } from '@/components/layouts/Header/HeaderApp/HeaderApp'
import { TailwindResponsiveHelper } from '@/components/layouts/helper/TailwindResponsiveHelper'
import { ErrorBoundary, RootErrorFallback } from '@/components/shared/error/ErrorBoundary'
import { useVisibleViewportHeightVar } from '@/components/shared/hooks/viewport/useVisibleViewportHeightVar'
import TanStackQueryDevtools from '@/components/shared/providers/tanstack-query/devtools'
import { Provider as TanStackQueryProvider } from '@/components/shared/providers/tanstack-query/root-provider'
import { AppToaster } from '@/components/shared/toast/AppToaster'

// Region map/preview routes use their own chrome — skip app header/footer here.
const HIDE_APP_CHROME_ROUTE_IDS = new Set([
  '/regionen/$regionSlug',
  '/preview/region-pending',
  '/preview/region-error',
])

export function LayoutRoot() {
  const { queryClient } = useRouteContext({ from: '__root__' })
  const matches = useMatches()
  const hideAppChrome = matches.some((m) => HIDE_APP_CHROME_ROUTE_IDS.has(m.routeId))

  useVisibleViewportHeightVar(hideAppChrome)

  return (
    // Full-bleed routes: map bg `#f0f0f0` on html/body blends iOS 26 status-bar chrome into the map.
    <html lang="de" className={twJoin('h-full', hideAppChrome && 'bg-[#f0f0f0]')}>
      <head>
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className={twJoin(
          'flex w-full min-w-0 flex-col bg-white text-gray-800 antialiased',
          hideAppChrome
            ? 'h-(--app-height,100dvh) overflow-hidden overscroll-none bg-[#f0f0f0]'
            : 'min-h-dvh overflow-x-clip',
        )}
      >
        <StrictMode>
          <TanStackQueryProvider queryClient={queryClient}>
            {!hideAppChrome && <HeaderApp />}
            <div className="flex w-full min-w-0 grow flex-col overflow-x-clip">
              <ErrorBoundary fallback={(props) => <RootErrorFallback {...props} />}>
                <Outlet />
              </ErrorBoundary>
            </div>
            {!hideAppChrome && <Footer />}
            <AppToaster />
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
        <Scripts />
      </body>
    </html>
  )
}
