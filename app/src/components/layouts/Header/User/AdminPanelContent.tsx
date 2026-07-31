import { useHydrated, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useMapDebugActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { parseMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import {
  googleMapsUrlViewport,
  mapillaryUrlViewport,
  osmUrlViewport,
  tildaInsectorUrl,
} from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/osmUrls/osmUrls'
import {
  useAdminPanelRegionContext,
  useOptionalRegionSlug,
} from '@/components/shared/hooks/useOptionalRegionSlug'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { Quote } from '@/components/shared/text/Quotes'
import { envKey } from '@/components/shared/utils/isEnv'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { type RegionAdminLink, regionAdminLinks } from './adminPanelLinks'
import { AdminRegionSwitch } from './AdminRegionSwitch'
import { getAdminInfoEnvUrl } from './utils/getAdminInfoEnvUrl'

const adminMenuSectionClassName = 'rounded-lg border border-pink-500/40 bg-white/50 p-3'

const AdminMenuSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className={adminMenuSectionClassName}>
    <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
    <ul className="space-y-1 text-sm leading-5">{children}</ul>
  </section>
)

type AdminMenuLinkItem =
  | { key: string; label: ReactNode; href: string }
  | { key: string; label: ReactNode; onClick: () => void }

const AdminMenuLink = ({ item }: { item: AdminMenuLinkItem }) => (
  <li>
    {'href' in item ? (
      <Link blank href={item.href}>
        {item.label}
      </Link>
    ) : (
      <button type="button" onClick={item.onClick} className={linkStyles}>
        {item.label}
      </button>
    )}
  </li>
)

const RegionAdminLinkItem = ({ entry }: { entry: RegionAdminLink }) => (
  <li>
    <Link to={entry.to} params={entry.params} search={entry.search}>
      {entry.label}
    </Link>
  </li>
)

const MapEnvironmentSection = () => {
  const hydrated = useHydrated()
  const { toggleShowDebugInfo } = useMapDebugActions()
  const regionSlug = useOptionalRegionSlug()
  const location = useLocation()

  const mapQuery = regionSlug
    ? new URLSearchParams(location.searchStr).get(searchParamsRegistry.map)
    : null
  const mapParam = mapQuery ? parseMapParam(mapQuery) : null

  const items: AdminMenuLinkItem[] = []

  if (mapParam) {
    items.push({
      key: 'mapDebug',
      label: (
        <>
          Toggle <code>mapDebug</code>
        </>
      ),
      onClick: () => toggleShowDebugInfo(),
    })
  }

  const pushHref = (key: string, label: ReactNode, href: string | undefined) => {
    if (href) items.push({ key, label, href })
  }

  if (hydrated && envKey !== 'development') {
    pushHref('dev', 'Open DEV', getAdminInfoEnvUrl('development'))
  }
  if (hydrated && envKey !== 'staging') {
    pushHref('staging', 'Open Staging', getAdminInfoEnvUrl('staging'))
  }
  if (hydrated && envKey !== 'production') {
    pushHref('production', 'Open Production', getAdminInfoEnvUrl('production'))
  }

  if (mapParam) {
    pushHref('viewer', 'Open Viewer', tildaInsectorUrl(mapParam.zoom, mapParam.lat, mapParam.lng))
    pushHref('osm', 'Open OSM', osmUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng))
    pushHref(
      'mapillary',
      'Open Mapillary',
      mapillaryUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng),
    )
    pushHref(
      'googleMaps',
      'Open GoogleMaps',
      googleMapsUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng),
    )
  }

  if (items.length === 0) return null

  return (
    <AdminMenuSection title="Karte & Umgebung">
      {items.map((item) => (
        <AdminMenuLink key={item.key} item={item} />
      ))}
    </AdminMenuSection>
  )
}

const RegionAdminSection = () => {
  const region = useAdminPanelRegionContext()
  const regionLinks = region ? regionAdminLinks(region.slug, region) : []

  return (
    <section className={adminMenuSectionClassName}>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">
        {region ? (
          <>
            Region <Quote>{region.name}</Quote>
          </>
        ) : (
          'Admin'
        )}
      </h3>
      <ul className="space-y-1 text-sm leading-5">
        <li>
          <Link to="/admin">Admin Bereich</Link>
        </li>
        {regionLinks.map((entry) => (
          <RegionAdminLinkItem key={entry.label} entry={entry} />
        ))}
      </ul>
    </section>
  )
}

export const AdminPanelContent = () => (
  <div className="space-y-4 p-4 text-xs leading-5 text-pink-950">
    <AdminRegionSwitch />

    <div className="grid gap-4 md:grid-cols-2">
      <RegionAdminSection />
      <MapEnvironmentSection />
    </div>
  </div>
)
