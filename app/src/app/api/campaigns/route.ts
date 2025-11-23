import { campaigns } from '@/src/data/radinfra-de/campaigns'
import { buildHashtags } from '@/src/data/radinfra-de/utils/buildHashtags'
import { CAMPAIGN_API_BASE_URL } from '../maproulette/data/[projectKey]/_utils/campaignApiBaseUrl.const'

    type CountResult = [{ count: bigint }]
    const result = await geoDataClient.$queryRaw<CountResult>`
      SELECT COUNT(*) as count
      FROM public.todos_lines
      WHERE todos_lines.tags ? ${campaignId}
    `
    return {
      campaignId,
      count: Number(result[0]?.count ?? 0),
    }
  })
  const countedAt = new Date().toISOString()
  return new Map(counts.map((c) => [c.campaignId, { count: c.count, countedAt }]))
}
export async function GET() {
  const result = campaigns.map((campaign) => {
    return {
      ...campaign,
      remoteGeoJson: `${CAMPAIGN_API_BASE_URL}${campaign.id}`,
      hashtags: buildHashtags(
        campaign?.id,
        campaign?.category,
        campaign?.maprouletteChallenge.enabled === true,
      ),
    }
  })
  return Response.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  })
}
