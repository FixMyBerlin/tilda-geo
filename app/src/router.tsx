import '@/lib/zodDeLocale'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import type { RoutePaths } from '@tanstack/router-core'
import * as TanstackQuery from '@/components/shared/providers/tanstack-query/root-provider'
import DefaultErrorComponent from './components/shared/error/DefaultError'
import DefaultPendingComponent from './components/shared/error/DefaultPending'
import NotFoundComponent from './components/shared/error/NotFound'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const rqContext = TanstackQuery.getContext()

  const router = createRouter({
    routeTree,
    trailingSlash: 'never',
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
export type InternalPath = RoutePaths<Router['routeTree']>
