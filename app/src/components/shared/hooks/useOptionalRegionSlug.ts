import { useRouterState } from '@tanstack/react-router'

const regionMapRouteId = '/regionen/$regionSlug'
const adminRegionEditRouteId = '/admin/regions/$regionSlug/edit'

/** Active slug on the public region map route only (not admin region edit). */
export const useOptionalRegionSlug = () =>
  useRouterState({
    select: (state) => {
      const match = state.matches.find((m) => m.routeId === regionMapRouteId)
      return match?.params?.regionSlug as string | undefined
    },
  })

/** Region slug when viewing the map or editing a region in admin. */
export const useAdminRegionSlug = () =>
  useRouterState({
    select: (state) => {
      const mapMatch = state.matches.find((m) => m.routeId === regionMapRouteId)
      if (mapMatch?.params?.regionSlug) return mapMatch.params.regionSlug as string

      const adminMatch = state.matches.find((m) => m.routeId === adminRegionEditRouteId)
      if (adminMatch?.params?.regionSlug) return adminMatch.params.regionSlug as string

      return undefined
    },
  })

export type AdminPanelRegionContext = {
  slug: string
  id: number
  name: string
  contract: { slug: string } | null
}

const toAdminPanelRegionContext = (region: {
  id: number
  slug: string
  name: string
  contract?: { slug: string } | null
}): AdminPanelRegionContext => ({
  id: region.id,
  slug: region.slug,
  name: region.name,
  contract: region.contract ? { slug: region.contract.slug } : null,
})

/** Region metadata for the admin panel on the map route or region edit page. */
export const useAdminPanelRegionContext = () =>
  useRouterState({
    select: (state): AdminPanelRegionContext | undefined => {
      const mapMatch = state.matches.find((m) => m.routeId === regionMapRouteId)
      // region now lives in the route loaderData (resolved in the loader, not beforeLoad context).
      const mapRegion = mapMatch?.loaderData?.region
      if (mapRegion) return toAdminPanelRegionContext(mapRegion)

      const adminMatch = state.matches.find((m) => m.routeId === adminRegionEditRouteId)
      const adminRegion = adminMatch?.loaderData?.region
      if (adminRegion) return toAdminPanelRegionContext(adminRegion)

      return undefined
    },
  })
