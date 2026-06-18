import { useHydrated, useLocation } from '@tanstack/react-router'
import { useMapDebugActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { searchParamsRegistry } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/searchParamsRegistry'
import { parseMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import {
  googleMapsUrlViewport,
  mapillaryUrlViewport,
  osmUrlViewport,
  tildaInsectorUrl,
} from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/osmUrls/osmUrls'
import { useOptionalRegionSlug } from '@/components/shared/hooks/useOptionalRegionSlug'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { envKey } from '@/components/shared/utils/isEnv'
import { isAdmin } from '@/components/shared/utils/usersUtils'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'
import { AdminRegionSwitch } from './AdminRegionSwitch'
import { getAdminInfoEnvUrl } from './utils/getAdminInfoEnvUrl'

type Props = {
  user: NonNullable<CurrentUser>
  inHeadlessMenu?: boolean
}

export const UserLoggedInAdminInfo = ({ user, inHeadlessMenu = false }: Props) => {
  const hydrated = useHydrated()
  const { toggleShowDebugInfo } = useMapDebugActions()
  const regionSlug = useOptionalRegionSlug()
  const location = useLocation()
  const mapQuery = regionSlug
    ? new URLSearchParams(location.searchStr).get(searchParamsRegistry.map)
    : null
  const mapParam = mapQuery ? parseMapParam(mapQuery) : null
  const osmUrlViewportUrl = mapParam && osmUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng)
  const mapillaryUrlViewportUrl =
    mapParam && mapillaryUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng)
  const googleMapsViewportUrl =
    mapParam && googleMapsUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng)
  const tildaViewerUrlHref = mapParam && tildaInsectorUrl(mapParam.zoom, mapParam.lat, mapParam.lng)

  const devUrl =
    hydrated && envKey !== 'development' ? getAdminInfoEnvUrl('development') : undefined
  const stagingUrl = hydrated && envKey !== 'staging' ? getAdminInfoEnvUrl('staging') : undefined
  const prodUrl = hydrated && envKey !== 'production' ? getAdminInfoEnvUrl('production') : undefined

  // CSV export URL for region uploads (static datasets)
  const regionCsvUrl = regionSlug ? `/api/regions/${regionSlug}/uploads.csv` : null

  if (!isAdmin(user)) return null

  return (
    <div className="bg-pink-300 px-4 py-2 text-xs leading-5">
      <p>
        Du bist <strong>Admin</strong>.
      </p>

      <AdminRegionSwitch inHeadlessMenu={inHeadlessMenu} />

      <ul>
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link to="/admin">Admin Bereich </Link>
          {regionSlug ? (
            <Link to="/admin/regions/$regionSlug/edit" params={{ regionSlug }}>
              Region bearbeiten
            </Link>
          ) : null}
        </li>
        {regionCsvUrl && (
          <li>
            <Link blank href={regionCsvUrl}>
              Export Static Data CSV
            </Link>
          </li>
        )}
        {mapParam && (
          <li>
            <button type="button" onClick={() => toggleShowDebugInfo()} className={linkStyles}>
              Toggle <code>mapDebug</code>
            </button>
          </li>
        )}
        {devUrl ? (
          <li>
            <Link blank href={devUrl}>
              Open DEV
            </Link>
          </li>
        ) : null}
        {stagingUrl ? (
          <li>
            <Link blank href={stagingUrl}>
              Open Staging
            </Link>
          </li>
        ) : null}
        {prodUrl ? (
          <li>
            <Link blank href={prodUrl}>
              Open Production
            </Link>
          </li>
        ) : null}
        <li>
          {tildaViewerUrlHref && (
            <Link blank href={tildaViewerUrlHref}>
              Open Viewer
            </Link>
          )}
        </li>
        {osmUrlViewportUrl && (
          <li>
            <Link blank href={osmUrlViewportUrl}>
              Open OSM
            </Link>
          </li>
        )}
        {mapillaryUrlViewportUrl && (
          <li>
            <Link blank href={mapillaryUrlViewportUrl}>
              Open Mapillary
            </Link>
          </li>
        )}
        {googleMapsViewportUrl && (
          <li>
            <Link blank href={googleMapsViewportUrl}>
              Open GoogleMaps
            </Link>
          </li>
        )}
      </ul>
    </div>
  )
}
