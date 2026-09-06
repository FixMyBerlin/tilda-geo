import { createFileRoute } from '@tanstack/react-router'
import { PageLayerOrder } from '@/components/admin/layerOrder/PageLayerOrder'
import { mapLayerOrderQueryOptions } from '@/server/map-layer-order/mapLayerOrderQueryOptions'

export const Route = createFileRoute('/admin/layer-order')({
  ssr: true,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(mapLayerOrderQueryOptions())
  },
  head: () => ({
    meta: [{ title: 'Layer-Reihenfolge – ADMIN TILDA' }],
  }),
  component: PageLayerOrder,
})
