import { isProd } from '@/src/app/_components/utils/isEnv'
import { campaigns } from '@/src/data/radinfra-de/campaigns'
import { buildHashtags } from '@/src/data/radinfra-de/utils/buildHashtags'
import { geoDataClient } from '@/src/server/prisma-client'
import { getProcessingMeta } from '../_util/getProcessingMeta'
import { CAMPAIGN_API_BASE_URL } from '../maproulette/data/[projectKey]/_utils/campaignApiBaseUrl.const'

export const dynamic = 'force-dynamic'

async function getOsmDataFrom() {
  const parsed = await getProcessingMeta()
  return parsed.osm_data_from?.toISOString() ?? new Date().toISOString()
}

async function getCampaignCountsByBundesland(campaignId: string) {
  type BundeslandCountResult = Array<{
    bundesland_id: string
    bundesland_name: string
    count: bigint
  }>
  const result = await geoDataClient.$queryRaw<BundeslandCountResult>`
    SELECT
      boundaries.id as bundesland_id,
      boundaries.tags->>'name' as bundesland_name,
      COUNT(DISTINCT todos_lines.osm_id) as count
    FROM public.boundaries
    INNER JOIN public.todos_lines ON ST_Intersects(todos_lines.geom, boundaries.geom)
    WHERE boundaries.tags->>'admin_level' = '4'
      AND todos_lines.tags ? ${campaignId}
    GROUP BY boundaries.id, boundaries.tags->>'name'
  `
  return result.map((r) => ({
    id: r.bundesland_id,
    name: r.bundesland_name,
    count: Number(r.count),
  }))
}

async function getCampaignCounts(campaignIds: string[]) {
  const countPromises = campaignIds.map(async (campaignId) => {
    type CountResult = [{ count: bigint }]
    const [totalResult, bundeslandCounts] = await Promise.all([
      geoDataClient.$queryRaw<CountResult>`
        SELECT COUNT(DISTINCT osm_id) as count
        FROM public.todos_lines
        WHERE todos_lines.tags ? ${campaignId}
      `,
      getCampaignCountsByBundesland(campaignId),
    ])
    return {
      campaignId,
      total: Number(totalResult[0]?.count ?? 0),
      byState: bundeslandCounts,
    }
  })
  const counts = await Promise.all(countPromises)
  const countedAt = await getOsmDataFrom()
  return new Map(
    counts.map((c) => [
      c.campaignId,
      {
        total: c.total,
        byState: c.byState,
        countedAt,
      },
    ]),
  )
}

export async function GET() {
  try {
    let countMap: Awaited<ReturnType<typeof getCampaignCounts>>
    try {
      countMap = await getCampaignCounts(campaigns.map((c) => c.id))
    } catch (error) {
      // Fallback: Return zero values when table doesn't exist
      // This happens during nightly processing when the todos_lines table is recreated.
      // Instead of breaking the endpoint, we return zero counts so the API remains available.
      countMap = new Map(
        campaigns.map((c) => [
          c.id,
          { total: 0, byState: [], countedAt: new Date().toISOString() },
        ]),
      )
    }

    const result = campaigns.map((campaign) => {
      return {
        ...campaign,
        remoteGeoJson: `${CAMPAIGN_API_BASE_URL}${campaign.id}`,
        hashtags: buildHashtags(
          campaign?.id,
          campaign?.category,
          campaign?.maprouletteChallenge.enabled === true,
        ),
        count: countMap.get(campaign.id)!,
      }
    })
    return Response.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error(error) // Logfile
    return Response.json(
      {
        error: 'Internal Server Error',
        info: isProd ? undefined : error,
      },
      { status: 500 },
    )
  }
}
