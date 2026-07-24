import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import {
  createAdminApiToken,
  listAdminApiTokens,
  revokeAdminApiToken,
} from '@/server/admin/adminApiTokens.server'
import { isPrismaRecordNotFound } from '@/server/api/admin/adminApiErrors.server'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'

export const getAdminApiTokensLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin(getRequestHeaders())
  const tokens = await listAdminApiTokens()
  return { tokens }
})

const CreateAdminApiTokenInput = z.object({ name: z.string().min(1) })

export const createAdminApiTokenFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateAdminApiTokenInput>) =>
    CreateAdminApiTokenInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const admin = await requireAdmin(headers)
    const { token, row } = await runWithAuditContextAsync(
      adminFormAuditContext(headers, admin.userId),
      () => createAdminApiToken({ name: data.name, createdById: admin.userId }),
    )
    // Plaintext token returned once for the admin to copy; never retrievable again.
    return { token, id: row.id, name: row.name }
  })

const RevokeAdminApiTokenInput = z.object({ id: z.string() })

export const revokeAdminApiTokenFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof RevokeAdminApiTokenInput>) =>
    RevokeAdminApiTokenInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const admin = await requireAdmin(headers)
    try {
      await runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
        revokeAdminApiToken(data.id),
      )
    } catch (error) {
      if (isPrismaRecordNotFound(error)) {
        throw new Error('API-Token nicht gefunden')
      }
      throw error
    }
    return { ok: true }
  })
