// QA style options
export const QA_STYLE_OPTIONS = [
  { key: 'none', label: 'Kein Stil' },
  { key: 'all', label: 'Alles anzeigen' },
  { key: 'good', label: 'Nur gute Bereiche' },
  { key: 'needs-review', label: 'Nur Bereiche die Review brauchen' },
  { key: 'problematic', label: 'Nur problematische Bereiche' },
] as const

export type QaStyleKey = (typeof QA_STYLE_OPTIONS)[number]['key']
