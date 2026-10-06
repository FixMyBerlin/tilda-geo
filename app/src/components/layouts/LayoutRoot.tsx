import { HeadContent, Outlet, Scripts, useMatches, useRouteContext } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { twJoin } from 'tailwind-merge'
import { Footer } from '@/components/layouts/Footer/Footer'
import { HeaderApp } from '@/components/layouts/Header/HeaderApp/HeaderApp'
import { DevHelpers } from '@/components/layouts/helper/DevHelpers'
import { ErrorBoundary, RootErrorFallback } from '@/components/shared/error/ErrorBoundary'
import { useVisibleViewportHeightVar } from '@/components/shared/hooks/viewport/useVisibleViewportHeightVar'
import { Provider as TanStackQueryProvider } from '@/components/shared/providers/tanstack-query/root-provider'
import { AppToaster } from '@/components/shared/toast/AppToaster'

// Region map/preview routes use their own chrome — skip app header/footer and lock the body to the map.
const FULL_BLEED_MAP_ROUTE_IDS = new Set([
  '/regionen/$regionSlug',
  '/preview/region-pending',
  '/preview/region-error',
])

// Admin renders its own sidebar shell (LayoutAdmin) but scrolls like a normal page.
const ADMIN_ROUTE_ID = '/admin'

export function LayoutRoot() {
  const { queryClient } = useRouteContext({ from: '__root__' })
  const matches = useMatches()
  const isFullBleedMapRoute = matches.some((m) => FULL_BLEED_MAP_ROUTE_IDS.has(m.routeId))
  const isAdminRoute = matches.some((m) => m.routeId === ADMIN_ROUTE_ID)
  const hideAppChrome = isFullBleedMapRoute || isAdminRoute

  useVisibleViewportHeightVar(isFullBleedMapRoute)

  return (
    // Full-bleed routes: map bg `#f0f0f0` on html/body blends iOS 26 status-bar chrome into the map.
    <html lang="de" className={twJoin('h-full', isFullBleedMapRoute && 'bg-[#f0f0f0]')}>
      <head>
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className={twJoin(
          'flex w-full min-w-0 flex-col bg-white text-gray-800 antialiased',
          isFullBleedMapRoute
            ? 'h-(--app-height,100dvh) overflow-hidden overscroll-none bg-[#f0f0f0]'
            : 'min-h-dvh overflow-x-clip',
        )}
      >
        <StrictMode>
          {/* All Motion animations respect the OS `prefers-reduced-motion` setting. */}
          <MotionConfig reducedMotion="user">
            <TanStackQueryProvider queryClient={queryClient}>
              {!hideAppChrome && <HeaderApp />}
              <div className="flex w-full min-w-0 grow flex-col overflow-x-clip">
                <ErrorBoundary fallback={(props) => <RootErrorFallback {...props} />}>
                  <Outlet />
                </ErrorBoundary>
              </div>
              {!hideAppChrome && <Footer />}
              <AppToaster />
              <DevHelpers />
            </TanStackQueryProvider>
          </MotionConfig>
        </StrictMode>
        <Scripts />
      </body>
    </html>
  )
}
