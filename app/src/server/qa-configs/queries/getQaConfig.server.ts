import { notFound } from '@tanstack/react-router'
import { type MemberCaller, requireAdminSession } from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { GetQaConfigSchema } from '../schemas'
import { parseQaConfigRow } from '../utils/parseQaConfigIndicators'

export async function getQaConfig(input: { id: number }, caller: MemberCaller) {
  await requireAdminSession(caller)
  const { id } = GetQaConfigSchema.parse(input)

  const qaConfig = await db.qaConfig.findFirst({
    where: { id },
    include: {
      region: true,
    },
  })

  if (!qaConfig) {
    throw notFound()
  }

  // Processing reads the reference amounts from this table; without it no indicator gets values.
  const referenceTableRows = await db.$queryRaw<Array<{ reg: string | null }>>`
    SELECT to_regclass(${qaConfig.referenceTable})::text AS reg
  `

  return {
    ...parseQaConfigRow(qaConfig),
    referenceTableExists: Boolean(referenceTableRows[0]?.reg),
  }
}
