import { z } from 'zod'
import {
  AUDIT_CHANGE_SOURCES,
  type AuditChangeSource,
} from '@/server/audit/auditChangeSources.const'

const auditLogMetadataSchema = z.object({
  changeSource: z.enum(AUDIT_CHANGE_SOURCES).optional(),
  adminTokenId: z.string().optional(),
})

export type AuditLogMetadata = z.infer<typeof auditLogMetadataSchema>

function parseAuditLogMetadata(value: unknown) {
  const parsed = auditLogMetadataSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function auditLogChangeSource(value: unknown): AuditChangeSource | null {
  return parseAuditLogMetadata(value)?.changeSource ?? null
}
