import { Parser } from '@json2csv/plainjs'
import type { QaConfigExportRow } from '@/server/qa-configs/queries/getQaConfigExportRows.server'

export const QA_CONFIG_EXPORT_FIELDS = [
  'area_id',
  'config_id',
  'config_slug',
  'config_map_table',
  'config_good_threshold',
  'config_needs_review_threshold',
  'config_absolute_difference_threshold',
  'latest_evaluation_id',
  'centroid_lat',
  'centroid_lng',
  'tilda_link',
  'count_reference',
  'count_current',
  'difference',
  'previous_relative',
  'relative',
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
