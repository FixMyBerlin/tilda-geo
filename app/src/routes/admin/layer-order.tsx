import { createFileRoute } from '@tanstack/react-router'
import { PageLayerOrder } from '@/components/admin/layerOrder/PageLayerOrder'
import { mapLayerOrderQueryOptions } from '@/server/map-layer-order/mapLayerOrderQueryOptions'

export const Route = createFileRoute('/admin/layer-order')({
  ssr: true,
  loader: ({ context }) => {
    // The map keeps this query for the whole session; the editor has to start from the saved order.
    void context.queryClient.prefetchQuery({ ...mapLayerOrderQueryOptions(), staleTime: 0 })
  },
  head: () => ({
    meta: [{ title: 'Layer-Reihenfolge – ADMIN TILDA' }],
  }),
  component: PageLayerOrder,
})
