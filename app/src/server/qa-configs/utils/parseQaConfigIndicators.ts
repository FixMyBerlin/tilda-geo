import type { Prisma } from '@/prisma/generated/client'
import {
  type QaDatasetKey,
  qaDatasetKeySchema,
  qaDatasets,
} from '@/server/qa-configs/qaDatasets.const'
import {
  type QaIndicator,
  qaIndicatorsSchema,
} from '@/server/qa-configs/schemas/qaIndicatorsSchema'

/**
 * `QaConfig.indicators` is a JSON column; every read path needs it as the validated array.
 * Throws on a malformed config — the admin form is the only writer and validates the same schema,
 * so a parse failure is a broken config, not a user input we could work around.
 */
export function parseQaConfigIndicators(indicators: Prisma.JsonValue) {
  return qaIndicatorsSchema.parse(indicators)
}

/**
 * A `QaConfig` row (with or without includes) with `dataset` narrowed to a known dataset key and
 * `indicators` parsed. Throws on an unknown dataset or malformed indicators.
 */
export function parseQaConfigRow<T extends { dataset: string; indicators: Prisma.JsonValue }>(
  qaConfig: T,
): Omit<T, 'dataset' | 'indicators'> & { dataset: QaDatasetKey; indicators: QaIndicator[] } {
  return {
    ...qaConfig,
    dataset: qaDatasetKeySchema.parse(qaConfig.dataset),
    indicators: parseQaConfigIndicators(qaConfig.indicators),
  }
}

/** The `qaDatasets` entry of a config. Throws on an unknown dataset. */
export function qaDatasetOf(qaConfig: { dataset: string }) {
  return qaDatasets[qaDatasetKeySchema.parse(qaConfig.dataset)]
}
