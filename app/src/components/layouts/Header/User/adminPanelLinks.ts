import type { InternalPath } from '@/router'

export type RegionAdminContext = {
  id: number
  name: string
  contract: { slug: string } | null
}

export type RegionAdminLink = {
  label: string
  to: InternalPath
  params?: Record<string, string>
  search?: Record<string, string>
}

export const regionAdminLinks = (
  regionSlug: string,
  region: RegionAdminContext,
): RegionAdminLink[] => {
  const links: RegionAdminLink[] = [
    {
      label: 'Region bearbeiten',
      to: '/admin/regions/$regionSlug/edit',
      params: { regionSlug },
    },
    {
      label: 'Änderungsverlauf',
      to: '/admin/audit-log',
      search: { model: 'Region', recordId: String(region.id) },
    },
    {
      label: 'Mitgliedschaft anlegen',
      to: '/admin/memberships/new',
      search: { regionSlug },
    },
    {
      label: 'Statische Daten (Uploads)',
      to: '/admin/map-dataset-uploads',
      search: { regionSlug },
    },
    {
      label: 'Export Static Data CSV',
      to: '/api/regions/$regionSlug/uploads-csv',
      params: { regionSlug },
    },
  ]

  if (region.contract) {
    links.push({
      label: 'Regionen-Auftrag bearbeiten',
      to: '/admin/region-contracts/$slug/edit',
      params: { slug: region.contract.slug },
    })
  }

  return links
}
