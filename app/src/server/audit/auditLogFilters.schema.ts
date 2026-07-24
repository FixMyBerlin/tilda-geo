import { z } from 'zod'
import { AUDIT_CHANGE_SOURCES } from '@/server/audit/auditChangeSources.const'
import { offsetSearchFields } from '@/shared/pagination/offsetSearchSchema'

const parseAuditLogDateBound = (value: string, bound: 'from' | 'to') => {
  const trimmed = value.trim()
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
  const iso = dateOnly ? `${trimmed}T${bound === 'to' ? '23:59:59.999' : '00:00:00.000'}Z` : trimmed
  return new Date(iso)
}

const optionalAuditLogDateBound = (bound: 'from' | 'to') =>
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return undefined

      const parsed = parseAuditLogDateBound(value, bound)
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({ code: 'custom', message: 'Invalid date' })
        return z.NEVER
      }
      return parsed
    })

/** JSON-Schema-safe filter fields for MCP tool inputSchema (wire types only). */
export const auditLogFilterWireFields = {
  model: z.string().optional(),
  recordId: z.coerce.string().optional(),
  userId: z.string().optional(),
  changeSource: z.enum(AUDIT_CHANGE_SOURCES).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
} as const

export const auditLogFilterFields = {
  ...auditLogFilterWireFields,
  from: optionalAuditLogDateBound('from'),
  to: optionalAuditLogDateBound('to'),
} as const

export const auditLogListSchema = z
  .object(auditLogFilterFields)
  .extend(offsetSearchFields({ maxTake: 200 }))

export type AuditLogListInput = z.input<typeof auditLogListSchema>

/** Parsed audit-log query filters (dates expanded at the schema boundary). */
export type AuditLogListFilters = Partial<z.output<typeof auditLogListSchema>>
