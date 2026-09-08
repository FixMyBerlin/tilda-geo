import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { AdminLayerOrder } from './AdminLayerOrder'

export function PageLayerOrder() {
  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/layer-order', name: 'Layer-Reihenfolge' }]} />
      </HeaderWrapper>
      <AdminLayerOrder />
    </>
  )
}
