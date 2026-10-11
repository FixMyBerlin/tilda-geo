import { z } from 'zod'
import {
  QA_TOTAL_INDICATOR_KEY,
  type QaIndicator,
} from '@/server/qa-configs/schemas/qaIndicatorsSchema'

const thresholds = (absoluteDifferenceThreshold: number) => ({
  goodThreshold: 0.1,
  needsReviewThreshold: 0.2,
  absoluteDifferenceThreshold,
})

/**
 * Fixed catalog of QA datasets. A dataset fixes what cannot vary per config: the unit of the
 * amount (parking spaces or bikelane meters), the label of the plain total, and the
 * source table whose topic-doc attributes can be picked as indicators (validateQaIndicatorTagKeys.ts),
 * and the map source whose Inspector translations name the values of such an attribute.
 * `defaultIndicators` is the starting set for a new config (admin form) and the seeds.
 */
export const qaDatasets = {
  parking_euvm: {
    label: 'Parkraum (eUVM)',
    unit: 'Stellplätze',
    unitSuffix: null,
    totalLabel: 'Stellplätze',
    sourceTable: 'parkings',
    inspectorSourceId: 'tilda_parkings',
    defaultIndicators: [
      { key: QA_TOTAL_INDICATOR_KEY, label: 'Stellplätze', ...thresholds(4) },
      { key: 'condition_category_primary', label: 'Parkbeschränkung', ...thresholds(4) },
    ],
  },
  bikelanes: {
    label: 'Radinfrastruktur',
    unit: 'm',
    unitSuffix: 'm',
    totalLabel: 'Länge',
    sourceTable: 'bikelanes',
    inspectorSourceId: 'atlas_bikelanes',
    // `category` also covers most of `traffic_sign` (the category is derived from it) and every
    // change in length; `oneway` is not part of the category.
    defaultIndicators: [
      { key: 'category', label: 'Kategorie', ...thresholds(50) },
      { key: 'oneway', label: 'Einbahnstraße', ...thresholds(100) },
    ],
  },
} as const satisfies Record<
  string,
  {
    label: string
    unit: string
    /** Short unit to put behind every number of a table; null when the unit is a word. */
    unitSuffix: string | null
    totalLabel: string
    sourceTable: string
    inspectorSourceId: string
    defaultIndicators: readonly QaIndicator[]
  }
>

export type QaDatasetKey = keyof typeof qaDatasets

/** Validates/narrows an arbitrary string to a known dataset key (e.g. the `QaConfig.dataset` DB column, which is a plain string). */
export const qaDatasetKeySchema = z.enum(
  Object.keys(qaDatasets) as [QaDatasetKey, ...QaDatasetKey[]],
)

/** Labels of `QaConfig.areaFilter` (admin form and the config info of the QA mode). */
export const qaAreaFilterLabels = {
  all: 'Alle Flächen',
  priority: 'Nur priorisierte Flächen',
  non_priority: 'Nur nicht-priorisierte Flächen',
  with_reference: 'Nur Flächen mit Referenzwerten',
} as const
