import { maprouletteRemoteGeoJsonUrl } from '@/scripts/MaprouletteCreate/utils/maprouletteRemoteGeoJsonUrl'
import { campaigns } from '@/src/data/radinfra-de/campaigns'
import { buildHashtags } from '@/src/data/radinfra-de/utils/buildHashtags'

export async function GET() {
  const result = campaigns.map((campaign) => {
    return {
      ...campaign,
      remoteGeoJson: maprouletteRemoteGeoJsonUrl(campaign.todoKey, campaign.maprouletteChallenge),
      hashtags: buildHashtags(
        campaign?.todoKey,
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
