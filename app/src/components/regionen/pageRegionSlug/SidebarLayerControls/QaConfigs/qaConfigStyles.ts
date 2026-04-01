import { frenchQuote } from '@/components/shared/text/Quotes'
import { systemStatusConfig, userStatusConfig } from '../../SidebarInspector/InspectorQa/qaConfigs'

// QA style options (listable: true = shows "list" button and modal with last 20 areas)
export const QA_STYLE_OPTIONS = [
  { key: 'none', label: 'Kein Stil' },
  { key: 'all', label: 'Alle Status' },
  {
    key: 'user-pending-needs-review',
    label: `Zu prüfen: System-Entscheidung ${frenchQuote(systemStatusConfig.NEEDS_REVIEW.label)}`,
    listable: true,
  },
  {
    key: 'user-pending-problematic',
    label: `Zu prüfen: System-Entscheidung ${frenchQuote(systemStatusConfig.PROBLEMATIC.label)}`,
    listable: true,
  },
  {
    key: 'user-not-ok-processing',
    label: `Nutzer: ${userStatusConfig.NOT_OK_PROCESSING_ERROR.label}`,
    listable: true,
  },
  {
    key: 'user-not-ok-osm',
    label: `Nutzer: ${userStatusConfig.NOT_OK_DATA_ERROR.label}`,
    listable: true,
  },
  {
    key: 'user-ok-construction',
    label: `Nutzer: ${userStatusConfig.OK_STRUCTURAL_CHANGE.label}`,
    listable: true,
  },
  {
    key: 'user-ok-reference-error',
    label: `Nutzer: ${userStatusConfig.OK_REFERENCE_ERROR.label}`,
    listable: true,
  },
  {
    key: 'user-ok-qa-tooling-error',
    label: `Nutzer: ${userStatusConfig.OK_QA_TOOLING_ERROR.label}`,
    listable: true,
  },
  { key: 'user-selected', label: 'Nutzer: Ausgewählte Nutzer' },
] as const satisfies readonly { key: string; label: string; listable?: true }[]

export type QaStyleKey = (typeof QA_STYLE_OPTIONS)[number]['key']

export function isListableOption(option: (typeof QA_STYLE_OPTIONS)[number]) {
  return 'listable' in option && option.listable === true
}
