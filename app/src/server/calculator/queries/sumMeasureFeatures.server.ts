import {
  type CalculatorDataset,
  calculatorPartKey,
} from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorDatasets.const'
import {
  calculatorAreaId,
  calculatorCombinedAreaId,
} from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorModeParam'
import type { AreasParam } from '@/components/regionen/pageRegionSlug/modes/drawAreasParam'
import { geoDataClient } from '@/server/prisma-client.server'

const STATEMENT_TIMEOUT_MS = 30_000

type Props = {
  datasets: CalculatorDataset['measureDatasets']
  areas: AreasParam
  /** The tags the sums are grouped by; a missing tag is `''`. */
  groupByKeys: string[]
  /** The numeric tags that are summed. */
  metrics: string[]
}

type SumRow = {
  /** The position of the area in `areas`; `null` for all areas together. */
  area: number | null
  part: string
  properties: Record<string, string>
  sums: Record<string, number>
  /** Per metric, the number of features without a value; they are not in `sums`. */
  missing: Record<string, number>
}

const isStatementTimeout = (error: unknown) =>
  /statement timeout|57014/.test(error instanceof Error ? error.message : String(error))

/**
 * How much of the datasets lies inside each drawn area, and inside all of them together: one row
 * per area, part and combination of the `groupByKeys` values. The measuring is the SQL function
 * `tilda_measure_sum` (`processing/measure/measure_functions.sql`).
 */
export async function sumMeasureFeatures({ datasets, areas, groupByKeys, metrics }: Props) {
  try {
    const rows = await geoDataClient.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT set_config('statement_timeout', ${String(STATEMENT_TIMEOUT_MS)}, TRUE)`
        return tx.$queryRaw<SumRow[]>`
          SELECT area, part, properties, sums, missing
          FROM tilda_measure_sum(${datasets}::text[], ${JSON.stringify(areas)}, ${groupByKeys}::text[], ${metrics}::text[])
        `
      },
      { timeout: STATEMENT_TIMEOUT_MS + 5_000 },
    )
    return {
      status: 'ok' as const,
      rows: rows.map(({ area, part, properties, sums, missing }) => ({
        area: area === null ? calculatorCombinedAreaId : calculatorAreaId(area),
        properties: { ...properties, [calculatorPartKey]: part },
        sums,
        missing,
      })),
    }
  } catch (error) {
    if (isStatementTimeout(error)) return { status: 'timeout' as const, rows: [] }
    throw error
  }
}
