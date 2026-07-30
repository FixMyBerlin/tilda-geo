import { createFileRoute } from '@tanstack/react-router'
import { isProd } from '@/components/shared/utils/isEnv'
import { campaigns } from '@/data/radinfra-de/campaigns'
import { buildHashtags } from '@/data/radinfra-de/utils/buildHashtags'
import { CAMPAIGN_API_BASE_URL } from '@/server/api/maproulette/campaignApiBaseUrl.const'
import { geoDataClient } from '@/server/prisma-client.server'

type CampaignCountSnapshot = {
  total: number
  byState: Array<{ id: string; name: string; count: number }>
}

type CampaignStatsRow = {
  stats: Record<string, CampaignCountSnapshot> | null
  osm_data_from: Date | null
}

async function getCampaignCounts(campaignIds: string[]) {
  const [row] = await geoDataClient.$queryRaw<CampaignStatsRow[]>`
    SELECT stats, osm_data_from
    FROM public.todos_lines_campaign_stats
    ORDER BY processing_id DESC
    LIMIT 1
  `

  const countedAt = row?.osm_data_from?.toISOString() ?? new Date().toISOString()
  const snapshot = row?.stats ?? {}

  return new Map(
    campaignIds.map((campaignId) => [
      campaignId,
      {
        total: snapshot[campaignId]?.total ?? 0,
        byState: snapshot[campaignId]?.byState ?? [],
        countedAt,
      },
    ]),
  )
}

export const Route = createFileRoute('/api/campaigns')({
  ssr: false,
  server: {
    handlers: {
      GET: async () => {
        try {
          let countMap: Awaited<ReturnType<typeof getCampaignCounts>> = new Map(
            campaigns.map((c) => [
              c.id,
              { total: 0, byState: [], countedAt: new Date().toISOString() },
            ]),
          )
          try {
            countMap = await getCampaignCounts(campaigns.map((c) => c.id))
          } catch {
            // Fallback: return zero counts when the stats table is unavailable
            // (e.g. before the first afterthought run on a fresh database).
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
              count: countMap.get(campaign.id) ?? 0,
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
      },
    },
  },
})
