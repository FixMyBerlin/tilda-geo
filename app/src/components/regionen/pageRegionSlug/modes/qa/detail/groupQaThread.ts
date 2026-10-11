import type {
  QaDecisionDataIndicator,
  QaEvaluationForArea,
} from '@/server/qa-configs/queries/getQaDecisionDataForArea.server'

/** Evaluations of one save (or one nightly run) are written within this time. */
const SAME_ENTRY_MS = 60_000

export type QaThreadIndicator = Pick<
  QaDecisionDataIndicator,
  'key' | 'label' | 'unit' | 'unitSuffix' | 'inspectorSourceId'
>

export type QaThreadEntry = {
  /** The evaluations of this entry, one per attribute, in the order of the config. */
  items: { indicator: QaThreadIndicator; evaluation: QaEvaluationForArea }[]
}

const belongsToEntry = (entry: QaThreadEntry, evaluation: QaEvaluationForArea) => {
  const first = entry.items[0]?.evaluation
  if (!first) return false
  return (
    first.evaluatorType === evaluation.evaluatorType &&
    first.author?.id === evaluation.author?.id &&
    first.body === evaluation.body &&
    Math.abs(new Date(first.createdAt).getTime() - new Date(evaluation.createdAt).getTime()) <=
      SAME_ENTRY_MS
  )
}

/**
 * The history of an area as one thread, newest first. A save stores one evaluation per decided
 * attribute, all with the same comment; they are one entry here, so the comment shows once.
 */
export const groupQaThread = (
  indicators: readonly (QaThreadIndicator & { history: readonly QaEvaluationForArea[] })[],
) => {
  const all = indicators
    .flatMap((indicator) => indicator.history.map((evaluation) => ({ indicator, evaluation })))
    // Stable sort: evaluations of the same time keep the order of the config.
    .sort(
      (a, b) =>
        new Date(b.evaluation.createdAt).getTime() - new Date(a.evaluation.createdAt).getTime(),
    )

  const entries: QaThreadEntry[] = []
  for (const item of all) {
    const entry = entries.find(
      (candidate) =>
        belongsToEntry(candidate, item.evaluation) &&
        candidate.items.every((existing) => existing.indicator.key !== item.indicator.key),
    )
    if (entry) entry.items.push(item)
    else entries.push({ items: [item] })
  }
  return entries
}
