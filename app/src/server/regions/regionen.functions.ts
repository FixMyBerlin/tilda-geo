import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { getRegions } from '@/server/regions/queries/getRegions.server'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { getCurrentUser } from '@/server/users/queries/getCurrentUser.server'

const emptyRegions: TRegion[] = []

export const getRegionenIndexLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const user = await getCurrentUser(headers)

  const [allRegionsForUser, nonPublicRegions, publicRegions] = await Promise.all([
    user?.id && user?.role
      ? getRegions({
          where: { memberships: { some: { userId: user.id } } },
        })
      : emptyRegions,
    user?.role === 'ADMIN'
      ? getRegions({
          where: {
            OR: [{ promoted: false }, { promoted: true, status: { not: 'PUBLIC' } }],
          },
        })
      : emptyRegions,
    getRegions({
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
