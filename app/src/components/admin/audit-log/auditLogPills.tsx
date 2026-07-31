import { Pill } from '@/components/shared/text/Pill'
import type { AuditChangeSource } from '@/server/audit/auditChangeSources.const'

const auditActionColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'green' as const
    case 'UPDATE':
      return 'blue' as const
    case 'DELETE':
      return 'red' as const
    default:
      return 'gray' as const
  }
}

export const auditChangeSourceColor = (source: AuditChangeSource) => {
  switch (source) {
    case 'ADMIN_FORM':
      return 'green' as const
    case 'MEMBER_FORM':
      return 'blue' as const
    case 'API':
      return 'purple' as const
    case 'MIGRATION':
      return 'yellow' as const
    default:
      return 'gray' as const
  }
}

export const AuditActionPill = ({ action }: { action: string }) => (
  <Pill color={auditActionColor(action)}>{action}</Pill>
)
