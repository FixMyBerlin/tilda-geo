import db from '@/db'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import { resolver } from '@blitzjs/rpc'
import { Ctx } from 'blitz'
import { z } from 'zod'
import { getQaTableName } from '../utils/getQaTableName'

const Schema = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
})

export type QaDecisionData = {
  relative: number | null
  referenceCount: number | null
  currentCount: number | null
  absoluteChange: number | null
}

export default resolver.pipe(
  resolver.zod(Schema),
  async ({ configSlug, areaId, regionSlug }, { session }: Ctx) => {
    const { isAuthorized } = await checkRegionAuthorization(session, regionSlug)

    if (!isAuthorized) {
      return null
    }

    const qaConfig = await db.qaConfig.findFirst({
      where: { slug: configSlug, region: { slug: regionSlug } },
    })

    if (!qaConfig) {
      return null
    }

    // Get the validated table name
    const tableName = getQaTableName(qaConfig.mapTable)

    // Use Prisma's $queryRawUnsafe with proper parameterization
    // Note: We can't use Prisma models for external tables, so we use $queryRawUnsafe
    // with proper parameterization to avoid SQL injection
    const result = await db.$queryRawUnsafe<
      Array<{
        relative: number | null
        referenceCount: number | null
        currentCount: number | null
        absoluteChange: number | null
      }>
    >(
      `
      SELECT
        relative,
        count_reference as "referenceCount",
        count_current as "currentCount",
        difference as "absoluteChange"
      FROM ${tableName}
      WHERE id = $1
    `,
      areaId,
    )

    const data = result[0]

    if (!data) {
      return null
    }

    return {
      relative: data.relative,
      referenceCount: data.referenceCount,
      currentCount: data.currentCount,
      absoluteChange: data.absoluteChange,
    } as QaDecisionData
  },
)
