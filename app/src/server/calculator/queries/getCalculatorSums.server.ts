import { z } from 'zod'
import {
  calculatorDatasetsForCategories,
  calculatorFilterKeys,
  calculatorPartKey,
} from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorDatasets.const'
import { zodAreasParam } from '@/components/regionen/pageRegionSlug/modes/drawAreasParam'
import { getAppSession } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'
import { sumMeasureFeatures } from './sumMeasureFeatures.server'

export const CalculatorSumsSchema = z.object({
  regionSlug: z.string(),
  /** A dataset of `calculatorDatasets.const.ts` (`sum.key`). */
  datasetId: z.string(),
  /** The drawn areas (`sum.areas`). */
  areas: zodAreasParam,
})

/**
 * The sums of the Summieren mode: open to everyone who can see the region. Tables, tags and
 * amounts come from the dataset definition, which the region must offer; the client only names
 * the dataset.
 */
export async function getCalculatorSums(
  input: z.infer<typeof CalculatorSumsSchema>,
  headers: Headers,
) {
  const { regionSlug, datasetId, areas } = input
  const noRows = { status: 'ok' as const, rows: [] }

  const appSession = await getAppSession(headers)
  const { isAuthorized } = await checkRegionAuthorization(appSession, regionSlug)
  if (!isAuthorized) return noRows

  const region = await getRegion({ slug: regionSlug })
  const dataset = calculatorDatasetsForCategories(region.categories).find(
    (candidate) => candidate.id === datasetId,
  )
  if (!dataset) return noRows

  return sumMeasureFeatures({
    datasets: dataset.measureDatasets,
    areas,
    groupByKeys: calculatorFilterKeys(dataset).filter((key) => key !== calculatorPartKey),
    metrics: Object.keys(dataset.sumKeys),
  })
}
