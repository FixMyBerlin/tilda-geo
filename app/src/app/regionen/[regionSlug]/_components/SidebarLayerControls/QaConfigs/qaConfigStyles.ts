import { userStatusConfig } from '../../SidebarInspector/InspectorQa/qaConfigs'

// QA style options
export const QA_STYLE_OPTIONS = [
  { key: 'none', label: 'Kein Stil' },
  { key: 'all', label: 'Alle Status' },
  {
    key: 'user-not-ok-processing',
    label: `Nutzer: ${userStatusConfig.NOT_OK_PROCESSING_ERROR.label}`,
  },
  { key: 'user-not-ok-osm', label: `Nutzer: ${userStatusConfig.NOT_OK_DATA_ERROR.label}` },
  { key: 'user-ok-construction', label: `Nutzer: ${userStatusConfig.OK_STRUCTURAL_CHANGE.label}` },
  { key: 'user-ok-reference-error', label: `Nutzer: ${userStatusConfig.OK_REFERENCE_ERROR.label}` },
  { key: 'user-other', label: `Nutzer: ${userStatusConfig.OTHER.label}` },
  { key: 'user-pending', label: 'Nuzter-Entscheidung steht aus' },
] as const

export type QaStyleKey = (typeof QA_STYLE_OPTIONS)[number]['key']
