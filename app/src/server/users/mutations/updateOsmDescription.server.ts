import type { z } from 'zod'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { UpdateOsmDescription } from '../schema'

export async function updateOsmDescription(
  data: z.infer<typeof UpdateOsmDescription>,
  headers: Headers,
) {
  const appSession = await requireAuth(headers)
  const parsed = UpdateOsmDescription.parse(data)
  await runWithAuditContextAsync(memberFormAuditContext(headers, appSession.userId), () =>
    db.user.update({ where: { id: appSession.userId }, data: parsed }),
  )
}
