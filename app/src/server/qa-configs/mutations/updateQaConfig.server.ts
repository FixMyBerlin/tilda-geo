import type { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  adminAuditContext,
  type MemberCaller,
  requireAdminSession,
} from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import { UpdateQaConfigFormSchema } from '../schemas'
import { assertValidQaConfigWriteData } from './assertQaConfigWriteData.server'

export async function updateQaConfigWithData(
  data: z.infer<typeof UpdateQaConfigFormSchema>,
  caller: MemberCaller,
) {
  try {
    const admin = await requireAdminSession(caller)
    const { id, ...updateData } = data
    await assertValidQaConfigWriteData({ id, ...updateData })

    await runWithAuditContextAsync(adminAuditContext(caller, admin.userId), () =>
      db.qaConfig.update({ where: { id }, data: updateData }),
    )
    return successState()
  } catch (error) {
    return errorState(error, 'Fehler beim Aktualisieren der QA-Konfiguration')
  }
}
