import { getTopicDocByTableName, isNumericTopicDocFormat } from '@/data/topicDocs/runtime'
import { qaDatasets, type QaDatasetKey } from '../qaDatasets.const'
import { qaIndicatorTagKey, type QaIndicator } from './qaIndicatorsSchema'

/**
 * Tags an indicator can split the amount by: the topic-doc attributes of the dataset's source
 * table, without numeric ones (split by exact value they would give one class per number).
 * Used by the admin form (choices) and the server-side validation below.
 */
export function getQaIndicatorAttributes(dataset: QaDatasetKey) {
  const topicDoc = getTopicDocByTableName(qaDatasets[dataset].sourceTable)
  return (topicDoc?.attributes ?? []).filter(
    (attribute) => !isNumericTopicDocFormat(attribute.type),
  )
}

/**
 * Validates every indicator key against `getQaIndicatorAttributes` (a JSON import or API write
 * cannot introduce unknown tags). The total needs no tag. Kept out of qaIndicatorsSchema.ts so that
 * schema does not load the topic docs.
 */
export function validateQaIndicatorTagKeys(
  dataset: QaDatasetKey,
  indicators: readonly QaIndicator[],
) {
  const knownKeys = new Set(getQaIndicatorAttributes(dataset).map((attribute) => attribute.key))
  return indicators
    .map(({ key }) => qaIndicatorTagKey(key))
    .filter((tagKey) => tagKey !== null && !knownKeys.has(tagKey))
    .map(
      (tagKey) =>
        `Merkmal "${tagKey}" ist für Datensatz "${dataset}" (Tabelle "${qaDatasets[dataset].sourceTable}") nicht wählbar`,
    )
}
