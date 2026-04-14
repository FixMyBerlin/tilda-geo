import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { getMapillaryCoverageMetadata } from '@/server/api/util/getMapillaryCoverageMetadata.server'
import { getAppSession } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'

export const getMapillaryCoverageMetadataLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => getMapillaryCoverageMetadata(),
)

const getRegionForDocsInputSchema = z.object({
  slug: z.string(),
})

export const getRegionForDocsLoaderFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.input<typeof getRegionForDocsInputSchema>) =>
    getRegionForDocsInputSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const appSession = await getAppSession(headers)
    const { isAuthorized } = await checkRegionAuthorization(appSession, data.slug)
    if (!isAuthorized) {
      return null
    }
    return getRegion({ slug: data.slug })
  })
