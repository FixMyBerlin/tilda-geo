import { getRouteApi } from '@tanstack/react-router'

const routeApi = getRouteApi('/regionen/$regionSlug')

/** Region config from DB (via route loader). */
export const useRegion = () => {
  const { region } = routeApi.useLoaderData()
  return region
}
