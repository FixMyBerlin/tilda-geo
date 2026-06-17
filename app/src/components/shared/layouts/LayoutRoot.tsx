import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { HeadContent, Outlet, Scripts, useMatches, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { StrictMode } from 'react'
import { twJoin } from 'tailwind-merge'
import { ErrorBoundary, RootErrorFallback } from '@/components/shared/error/ErrorBoundary'
import { useVisibleViewportHeightVar } from '@/components/shared/hooks/viewport/useVisibleViewportHeightVar'
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

  // On full-bleed routes, publish the real visible viewport height to `--app-height` so the
  // wrappers below can lock to it (raw `dvh` is unreliable on Chrome/Firefox iOS — see the hook).
  useVisibleViewportHeightVar(hideAppChrome)

  return (
    // On full-bleed map routes, tint the document background to the map's base colour
    // (`#f0f0f0` = the map style's `background` layer at the usual zoom levels, see
    // server/api/map-style/style.json). iOS 26 Safari samples the root background colour to fill
    // the area behind the status bar and the floating Liquid-Glass toolbar — it refuses to paint
    // `position:fixed`/`100vh` content there — so matching that colour blends the chrome bands into
    // the map instead of showing jarring white strips. Other routes stay white.
    <html lang="de" className={twJoin('h-full', hideAppChrome && 'bg-[#f0f0f0]')}>
      <head>
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className={twJoin(
          'flex w-full bg-white text-gray-800 antialiased',
          // Full-bleed map/preview routes: pin the document to the *measured* visible viewport
          // (`--app-height`, with `100dvh` as the pre-hydration fallback) and forbid scroll/
          // overscroll so iOS leaves no gray strip and Chrome iOS can't scroll the floating header
          // away. The map base colour (matches `html` above) keeps the iOS 26 chrome bands from
          // flashing white. Other routes keep their normal scrollable min-height.
          hideAppChrome
            ? 'h-(--app-height,100dvh) overflow-hidden overscroll-none bg-[#f0f0f0]'
            : 'min-h-dvh',
        )}
      >
        <div
          className={twJoin(
            'flex w-full flex-col',
            hideAppChrome ? 'h-(--app-height,100dvh)' : 'min-h-dvh',
          )}
        >
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
