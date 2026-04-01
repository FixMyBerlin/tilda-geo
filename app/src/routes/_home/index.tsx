import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'
import { PageIndex } from '@/components/home/PageIndex'
import { getRedirectCookieFn } from '@/server/auth/auth.functions'

export const Route = createFileRoute('/_home/')({
  ssr: true,
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
