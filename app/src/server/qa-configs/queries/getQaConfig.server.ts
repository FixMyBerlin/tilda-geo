import { notFound } from '@tanstack/react-router'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { GetQaConfigSchema } from '../schemas'

export async function getQaConfig(input: { id: number }, headers: Headers) {
  await requireAdmin(headers)
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

  return qaConfig
}
