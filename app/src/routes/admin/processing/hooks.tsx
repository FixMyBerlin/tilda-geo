import { createFileRoute } from '@tanstack/react-router'
import { PageProcessingHooks } from '@/components/admin/processing/PageProcessingHooks'

export const Route = createFileRoute('/admin/processing/hooks')({
  ssr: true,
  head: () => ({
    meta: [{ title: 'Pipeline-Hooks – ADMIN TILDA' }],
  }),
  component: PageProcessingHooks,
})
