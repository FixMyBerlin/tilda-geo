import { createFileRoute } from '@tanstack/react-router'
import { PageDatenschutz } from '@/components/pages/datenschutz/PageDatenschutz'

export const Route = createFileRoute('/_pages/datenschutz')({
  ssr: true,
  head: () => ({
    meta: [
      { name: 'robots', content: 'noindex' },
      { title: 'Datenschutzerklärung – tilda-geo.de' },
    ],
  }),
  component: PageDatenschutz,
})
