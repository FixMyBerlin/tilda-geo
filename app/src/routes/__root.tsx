import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, redirect } from '@tanstack/react-router'
import { LayoutRoot } from '@/components/shared/layouts/LayoutRoot'
import { APP_META } from '@/meta.const'
import appCss from '@/components/shared/layouts/global.css?url'

type MyRouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  ssr: true,
  // Canonical URLs without a trailing slash (matches `trailingSlash: 'never'` in router).
  // If we ever need the same rule at the HTTP edge (crawlers, bookmarks before hydration),
  // add a Nitro plugin alongside nitro-www-redirect.plugin.server.ts.
  beforeLoad: ({ location }) => {
    const { pathname, searchStr, hash } = location
    if (pathname.length <= 1 || !pathname.endsWith('/')) return
    const stripped = pathname.replace(/\/+$/, '') || '/'
    throw redirect({
      href: `${stripped}${searchStr}${hash ? `#${hash}` : ''}`,
      replace: true,
    })
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: APP_META.themeColor },
      { title: APP_META.title },
      { name: 'description', content: APP_META.description },
      { property: 'og:title', content: APP_META.title },
      { property: 'og:description', content: APP_META.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'de_DE' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:creator', content: '@fixmyberlin' },
      ...(import.meta.env.VITE_APP_ENV !== 'production'
        ? [{ name: 'robots', content: 'noindex' }]
        : []),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { rel: 'icon', href: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),

  component: LayoutRoot,
})
