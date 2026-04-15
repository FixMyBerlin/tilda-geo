import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { canAccessQaForRegion } from '@/server/qa-configs/authorization/canAccessQaForRegion.server'
import { getQaTableName } from '../utils/getQaTableName'

const Schema = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
})

const QaDecisionDataResultSchema = z.object({
  relative: z.coerce.number().nullable(),
  referenceCount: z.coerce.number().nullable(),
  currentCount: z.coerce.number().nullable(),
  absoluteChange: z.coerce.number().nullable(),
})

export type QaDecisionData = z.infer<typeof QaDecisionDataResultSchema>

export async function getQaDecisionDataForArea(input: z.infer<typeof Schema>, headers: Headers) {
  const appSession = await getAppSession(headers)

  const { configSlug, areaId, regionSlug } = Schema.parse(input)

  const { isAuthorized } = await canAccessQaForRegion(appSession, regionSlug)

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

  return QaDecisionDataResultSchema.parse(data)
}
