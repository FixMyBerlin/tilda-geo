// QA style options
export const QA_STYLE_OPTIONS = [
  { key: 'none', label: 'Kein Stil' },
  { key: 'all', label: 'Alle Status' },
  { key: 'user-not-ok-processing', label: 'Nutzer: Nicht OK - Verarbeitungsfehler' },
  { key: 'user-not-ok-osm', label: 'Nutzer: Nicht OK - Datenfehler' },
  { key: 'user-ok-construction', label: 'Nutzer: OK - Strukturelle Änderung' },
  { key: 'user-ok-reference-error', label: 'Nutzer: OK - Referenzfehler' },
  { key: 'user-pending', label: 'Nuzter-Entscheidung steht aus' },
] as const

export type QaStyleKey = (typeof QA_STYLE_OPTIONS)[number]['key']
