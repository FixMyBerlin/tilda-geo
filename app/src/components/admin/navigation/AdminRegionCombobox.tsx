import { useMatch, useNavigate } from '@tanstack/react-router'
import { AdminRegionPicker } from './AdminRegionPicker'

type Props = {
  /** Closes the mobile drawer after picking a region. */
  onNavigate?: () => void
}

/**
 * Sidebar jump: search by name / slug, picking one opens its edit page. On
 * `/admin/regions/$regionSlug/edit` the current region is the input's resting value.
 */
export const AdminRegionCombobox = ({ onNavigate }: Props) => {
  const navigate = useNavigate()
  const editMatch = useMatch({ from: '/admin/regions/$regionSlug/edit', shouldThrow: false })
  const currentSlug = editMatch?.params.regionSlug

  return (
    <AdminRegionPicker
      tone="dark"
      label="Region öffnen"
      placeholder="Region öffnen…"
      searchIcon
      value={currentSlug}
      onChange={(slug) => {
        if (!slug) return
        onNavigate?.()
        if (slug === currentSlug) return
        void navigate({
          to: '/admin/regions/$regionSlug/edit',
          params: { regionSlug: slug },
        })
      }}
    />
  )
}
