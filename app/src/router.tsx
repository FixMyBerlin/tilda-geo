import '@/lib/zodDeLocale'
import { createRouter, type LinkProps } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from '@/components/shared/providers/tanstack-query/root-provider'
import { routerSearch } from '@/shared/routing/routerSearch'
import DefaultErrorComponent from './components/shared/error/DefaultError'
import DefaultPendingComponent from './components/shared/error/DefaultPending'
import NotFoundComponent from './components/shared/error/NotFound'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const rqContext = TanstackQuery.getContext()

  const router = createRouter({
    routeTree,
    trailingSlash: 'never',
    parseSearch: routerSearch.parse,
    stringifySearch: routerSearch.stringify,
    context: {
      ...rqContext,
    },
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultErrorComponent,
    defaultPendingComponent: DefaultPendingComponent,
    defaultNotFoundComponent: NotFoundComponent,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  return router
}

export type Router = ReturnType<typeof getRouter>
// The set of paths `<Link to>` accepts for the registered router. Derived from LinkProps (not
// RoutePaths) so it honors `trailingSlash: 'never'` — RoutePaths also includes the trailing-slash
// index variants that Link rejects.
export type InternalPath = Extract<NonNullable<LinkProps['to']>, string>
