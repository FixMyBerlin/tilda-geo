import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'
import { PageIndex } from '@/components/home/PageIndex'
import { APP_META } from '@/meta.const'
import { getRedirectCookieFn } from '@/server/auth/auth.functions'

export const Route = createFileRoute('/')({
  ssr: true,
  head: () => ({
    meta: [{ title: APP_META.title }],
  }),
  beforeLoad: async () => {
    try {
      const { redirectUrl } = await getRedirectCookieFn()
      if (redirectUrl) throw redirect({ to: redirectUrl })
    } catch (e) {
      if (isRedirect(e)) throw e
    }
  },
  component: PageIndex,
})
