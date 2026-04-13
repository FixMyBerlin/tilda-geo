import { useHydrated, useLocation } from '@tanstack/react-router'
import { useMemo } from 'react'
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
import { isAdmin } from '@/components/shared/utils/usersUtils'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'
import { getAdminInfoEnvUrl } from './utils/getAdminInfoEnvUrl'

type Props = {
  user: NonNullable<CurrentUser>
}

export const UserLoggedInAdminInfo = ({ user }: Props) => {
  const hydrated = useHydrated()
  const { toggleShowDebugInfo } = useMapDebugActions()
  const regionSlug = useOptionalRegionSlug()
  const location = useLocation()
  const mapParam = useMemo(() => {
    if (!regionSlug) return null
    const mapQuery = new URLSearchParams(location.searchStr).get(searchParamsRegistry.map)
    return mapQuery ? parseMapParam(mapQuery) : null
  }, [regionSlug, location.searchStr])
  const osmUrlViewportUrl = mapParam && osmUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng)
  const mapillaryUrlViewportUrl =
    mapParam && mapillaryUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng)
  const googleMapsViewportUrl =
    mapParam && googleMapsUrlViewport(mapParam.zoom, mapParam.lat, mapParam.lng)
  const tildaViewerUrlHref = mapParam && tildaInsectorUrl(mapParam.zoom, mapParam.lat, mapParam.lng)

  const devUrl = hydrated ? getAdminInfoEnvUrl('development') : undefined
  const stagingUrl = hydrated ? getAdminInfoEnvUrl('staging') : undefined
  const prodUrl = hydrated ? getAdminInfoEnvUrl('production') : undefined

  // CSV export URL for region uploads (static datasets)
  const regionCsvUrl = regionSlug ? `/api/regions/${regionSlug}/uploads.csv` : null

  if (!isAdmin(user)) return null

  return (
    <div className="bg-pink-300 px-4 py-2 text-xs leading-5">
      <p>
        Du bist <strong>Admin</strong>.
      </p>

      <ul>
        <li>
          <Link to="/admin">Admin Bereich</Link>
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
        <li>
          {devUrl && (
            <Link blank href={devUrl}>
              Open DEV
            </Link>
          )}
        </li>
        <li>
          {stagingUrl && (
            <Link blank href={stagingUrl}>
              Open Staging
            </Link>
          )}
        </li>
        <li>
          {prodUrl && (
            <Link blank href={prodUrl}>
              Open Production
            </Link>
          )}
        </li>
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
