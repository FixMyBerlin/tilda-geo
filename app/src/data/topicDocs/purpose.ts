import type { TopicDocAttributePurpose } from './schema'

export const topicDocPurposeMeta = {
  experimentation: {
    heading: 'Experimentelle Tags',
    pillLabel: 'Experimentation',
    pillClassName: 'border border-amber-200 bg-amber-100 text-amber-900',
    legendText: 'Experimentelle OSM-nahe Felder, die sich noch ändern können',
  },
  processing: {
    heading: 'Processing-Helfer',
    pillLabel: 'Processing',
    pillClassName: 'border border-sky-200 bg-sky-100 text-sky-900',
    legendText: 'Technische Hilfswerte aus dem Verarbeitungsprozess',
  },
  rendering: {
    heading: 'Nur Darstellung',
    pillLabel: 'Rendering',
    pillClassName: 'border border-slate-200 bg-slate-100 text-slate-800',
    legendText: 'Existiert nur zur Kartendarstellung',
  },
  qa: {
    heading: 'QA-Tags',
    pillLabel: 'QA',
    pillClassName: 'border border-violet-200 bg-violet-100 text-violet-900',
    legendText: 'Qualitaetssicherungswerte fuer Pruefung und Kontrolle',
  },
} satisfies Record<
  TopicDocAttributePurpose,
  {
    heading: string
    pillLabel: string
    pillClassName: string
    legendText: string
  }
>

export const topicDocPurposeOrder = [
  'experimentation',
  'processing',
  'rendering',
  'qa',
] as const satisfies ReadonlyArray<TopicDocAttributePurpose>
