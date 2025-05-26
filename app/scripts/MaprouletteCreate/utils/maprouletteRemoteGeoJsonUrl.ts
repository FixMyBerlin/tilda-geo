import { CAMPAIGN_API_BASE_URL } from '@/src/app/api/maproulette/data/[todoKey]/_utils/campaignApiBaseUrl.const'
import { CampaignType } from '@/src/data/radinfra-de/schema/campaignsSchema'

export const maprouletteRemoteGeoJsonUrl = (
  todoKey: string,
  maprouletteChallenge: CampaignType['maprouletteChallenge'],
) => {
  const remoteGeoJsonUrl = new URL(`${CAMPAIGN_API_BASE_URL}${todoKey}`)

  if (maprouletteChallenge.enabled === false) {
    return remoteGeoJsonUrl.toString()
  }

  if (maprouletteChallenge.filterMapillary) {
    remoteGeoJsonUrl.searchParams.append('filterMapillary', maprouletteChallenge.filterMapillary)
  }

  return remoteGeoJsonUrl.toString()
}
