import { createFileRoute } from '@tanstack/react-router'
import { PageLayerOrder } from '@/components/admin/layerOrder/PageLayerOrder'

export const Route = createFileRoute('/admin/layer-order')({
  ssr: true,
  head: () => ({
    meta: [{ title: 'Layer-Reihenfolge – ADMIN TILDA' }],
  }),
  component: PageLayerOrder,
})
