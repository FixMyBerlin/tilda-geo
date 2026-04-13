import { getRouteApi } from '@tanstack/react-router'

const routeApi = getRouteApi('/regionen/$regionSlug')

export function useRegionLoaderData() {
  const data = routeApi.useLoaderData()
  if (!data?.authorized) {
    throw new Error('useRegionLoaderData can only be used when region access is authorized')
  }
  return data
}
