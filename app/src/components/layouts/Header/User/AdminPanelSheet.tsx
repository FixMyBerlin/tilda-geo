import { MobileBottomSheet } from '@/components/regionen/pageRegionSlug/mobile/MobileBottomSheet'
import { AdminPanelContent } from './AdminPanelContent'

type Props = {
  open: boolean
  onClose: () => void
}

// Loaded with React.lazy from `AdminPanelTrigger` on the first open, so pages do not load the
// bottom sheet and its animation code for a closed panel.
export default function AdminPanelSheet({ open, onClose }: Props) {
  return (
    <MobileBottomSheet open={open} onClose={onClose} title="Admin" tone="debug" mapPeek="20%">
      <AdminPanelContent />
    </MobileBottomSheet>
  )
}
