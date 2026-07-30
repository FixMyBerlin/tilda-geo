/** Values stored in AuditLog.metadata.changeSource. MCP uses the same Bearer API → logged as API. */
export const AUDIT_CHANGE_SOURCES = ['ADMIN_FORM', 'MEMBER_FORM', 'MIGRATION', 'API'] as const

export type AuditChangeSource = (typeof AUDIT_CHANGE_SOURCES)[number]

export const auditChangeSourceFilterLabel = AUDIT_CHANGE_SOURCES.join('|')
