import type { InternalPath } from '@/router'

type AdminRegionNavRegion = {
  slug: string
  contract: { slug: string } | null
}

type AdminRegionNavLinkKey =
  | 'edit'
  | 'members'
  | 'newMembership'
  | 'uploads'
  | 'qaConfigs'
  | 'reviewLists'
  | 'auditLog'
  | 'contract'
  | 'uploadsCsv'

export type AdminRegionNavLink = {
  key: AdminRegionNavLinkKey
  name: string
  to: InternalPath
  params?: Record<string, string>
  search?: Record<string, string>
  /** Leaves the app routes (file download) — opens in a new tab. */
  external?: true
}

/**
 * Region-scoped admin links for the public header admin sheet (`AdminPanelContent`), which opens on
 * the region map. Inside the admin shell the region edit page carries these links itself. The lists
 * open filtered to the region (`?regionSlug=`).
 */
export function buildAdminRegionNavigation(region: AdminRegionNavRegion) {
  const regionSlug = region.slug
  const links: AdminRegionNavLink[] = [
    {
      key: 'edit',
      name: 'Region bearbeiten',
      to: '/admin/regions/$regionSlug/edit',
      params: { regionSlug },
    },
    {
      key: 'members',
      name: 'Mitglieder',
      to: '/admin/memberships',
      search: { regionSlug },
    },
    {
      key: 'newMembership',
      name: 'Mitgliedschaft anlegen',
      to: '/admin/memberships/new',
      search: { regionSlug },
    },
    {
      key: 'uploads',
      name: 'Uploads',
      to: '/admin/map-dataset-uploads',
      search: { regionSlug },
    },
    {
      key: 'qaConfigs',
      name: 'QA-Konfigurationen',
      to: '/admin/qa-configs',
      search: { regionSlug },
    },
    {
      key: 'reviewLists',
      name: 'Prüflisten',
      to: '/admin/review-lists',
      search: { regionSlug },
    },
    {
      key: 'auditLog',
      name: 'Änderungsverlauf',
      to: '/admin/audit-log',
      search: { regionSlug },
    },
  ]

  if (region.contract) {
    links.push({
      key: 'contract',
      name: 'Regionen-Auftrag bearbeiten',
      to: '/admin/region-contracts/$slug/edit',
      params: { slug: region.contract.slug },
    })
  }

  links.push({
    key: 'uploadsCsv',
    name: 'Uploads als CSV',
    to: '/api/regions/$regionSlug/uploads-csv',
    params: { regionSlug },
    external: true,
  })

  return links
}
