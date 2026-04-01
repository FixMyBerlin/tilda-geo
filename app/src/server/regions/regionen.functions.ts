import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import type { RegionWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import { getRegionsWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import { getCurrentUser } from '@/server/users/queries/getCurrentUser.server'

const emptyRegions: RegionWithAdditionalData[] = []

export const getRegionenIndexLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const user = await getCurrentUser(headers)

  const [allRegionsForUser, nonPublicRegions, publicRegions] = await Promise.all([
    user?.id && user?.role
      ? getRegionsWithAdditionalData({
          where: { Membership: { some: { userId: user.id } } },
        })
      : emptyRegions,
    user?.role === 'ADMIN'
      ? getRegionsWithAdditionalData({
          where: {
            OR: [{ promoted: false }, { promoted: true, status: { not: 'PUBLIC' } }],
          },
        })
      : emptyRegions,
    getRegionsWithAdditionalData({
      where: { promoted: true, status: 'PUBLIC' },
    }),
  ])
  const activeRegions = allRegionsForUser.filter((r) => r.status !== 'DEACTIVATED')
  const deactivatedRegions = allRegionsForUser.filter((r) => r.status === 'DEACTIVATED')

  return {
    activeRegions,
    deactivatedRegions,
    nonPublicRegions,
    publicRegions,
  }
})
