/**
 * Values stored in AuditLog.metadata.changeSource. MCP uses the same Bearer API → logged as API.
 * EXTERNAL_API: member writes through the external notes API (e.g. internal notes from the iD editor).
 */
export const AUDIT_CHANGE_SOURCES = [
  'ADMIN_FORM',
  'MEMBER_FORM',
  'MIGRATION',
  'API',
  'EXTERNAL_API',
] as const

export type AuditChangeSource = (typeof AUDIT_CHANGE_SOURCES)[number]

export const auditChangeSourceFilterLabel = AUDIT_CHANGE_SOURCES.join('|')
