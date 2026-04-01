import { createFileRoute } from '@tanstack/react-router'
import { PageAccessDenied } from '@/components/pages/accessDenied/PageAccessDenied'

export const Route = createFileRoute('/_pages/access-denied')({
  ssr: true,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
    title: 'Zugriff verweigert – TILDA',
  }),
  component: PageAccessDenied,
})
