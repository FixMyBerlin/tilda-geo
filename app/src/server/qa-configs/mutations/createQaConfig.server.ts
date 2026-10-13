import type { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  adminAuditContext,
  type MemberCaller,
  requireAdminSession,
} from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import { CreateQaConfigFormSchema } from '../schemas'
import { assertValidQaConfigWriteData } from './assertQaConfigWriteData.server'

export async function createQaConfigWithData(
  data: z.infer<typeof CreateQaConfigFormSchema>,
  caller: MemberCaller,
) {
  try {
    const admin = await requireAdminSession(caller)
    await assertValidQaConfigWriteData(data)

    const { id } = await runWithAuditContextAsync(adminAuditContext(caller, admin.userId), () =>
      db.qaConfig.create({ data, select: { id: true } }),
    )
    return successState({ data: { id } })
  } catch (error) {
    return errorState(error, 'Fehler beim Anlegen der QA-Konfiguration')
  }
}
