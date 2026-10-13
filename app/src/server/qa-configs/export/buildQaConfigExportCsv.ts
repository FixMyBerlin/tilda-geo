import { Parser } from '@json2csv/plainjs'
import type { QaConfigExportRow } from '@/server/qa-configs/queries/getQaConfigExportRows.server'

/** Long format: one line per (area, indicator). */
const QA_CONFIG_EXPORT_FIELDS = [
  'area_id',
  'indicator_key',
  'config_id',
  'config_slug',
  'config_map_table',
  'config_dataset',
  'indicator_label',
  'indicator_unit',
  'indicator_good_threshold',
  'indicator_needs_review_threshold',
  'indicator_absolute_difference_threshold',
  'latest_evaluation_id',
  'centroid_lat',
  'centroid_lng',
  'tilda_link',
  'reference',
  'current',
  'difference',
  'deviation',
  'breakdown',
  'system_status',
  'user_status',
  'evaluator_type',
  'evaluation_created_at',
  'body',
  'decision_data',
  'user_eval_count',
  'system_eval_count',
] as const satisfies readonly (keyof QaConfigExportRow)[]

export function buildQaConfigExportCsv(rows: QaConfigExportRow[]) {
  const parser = new Parser({
    fields: [...QA_CONFIG_EXPORT_FIELDS],
    delimiter: ';',
  })
  return parser.parse(rows)
}
