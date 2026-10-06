import { createFileRoute } from '@tanstack/react-router'
import { PageKontakt } from '@/components/pages/kontakt/PageKontakt'

export const Route = createFileRoute('/_pages/kontakt')({
  ssr: true,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }, { title: 'Kontakt – tilda-geo.de' }],
  }),
  component: PageKontakt,
})
