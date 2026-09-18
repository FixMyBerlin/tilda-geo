import { useNavigate, useSearch } from '@tanstack/react-router'
import { AdminRegionPicker } from '@/components/admin/navigation/AdminRegionPicker'

const readRegionSlug = (search: unknown) => {
  const regionSlug = (search as { regionSlug?: unknown }).regionSlug
  return typeof regionSlug === 'string' && regionSlug ? regionSlug : undefined
}

/**
 * List filter bound to `?regionSlug=` („Region: Alle Regionen“); picking a region navigates with
 * `replace` and resets `page`. The route’s `validateSearch` must accept `regionSlug` and its loader
 * must load `adminNavRegionsQueryOptions`.
 */
export const AdminRegionFilter = () => {
  const navigate = useNavigate()
  const regionSlug = readRegionSlug(useSearch({ strict: false }))

  const writeRegionSlug = (next: string | undefined) => {
    if (next === regionSlug) return
    void navigate({
      to: '.',
      replace: true,
      search: (prev: Record<string, unknown>) => ({ ...prev, regionSlug: next, page: undefined }),
    } as Parameters<typeof navigate>[0])
  }

  return (
    <AdminRegionPicker
      tone="light"
      label="Region"
      inlineLabel
      placeholder="Alle Regionen"
      allowClear
      allOptionLabel="Alle Regionen"
      value={regionSlug}
      onChange={writeRegionSlug}
    />
  )
}
