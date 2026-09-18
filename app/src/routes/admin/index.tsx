import { createFileRoute } from '@tanstack/react-router'
import { PageIndex } from '@/components/admin/PageIndex'

export const Route = createFileRoute('/admin/')({
  ssr: true,
  head: () => ({
    meta: [{ title: 'Übersicht – ADMIN TILDA' }],
  }),
  component: PageIndex,
})
