import { campaigns } from '@/src/data/radinfra-de/campaigns'
import { CampaignMaprouletteSchema } from '@/src/data/radinfra-de/schema/campaignsSchema'
import chalk from 'chalk'
import { maprouletteChallengeUrl } from '../../MaprouletteCreate/utils/maprouletteChallengeUrl'
import { checkChallengeStatus } from './checkChallengeStatus'
const { gray, green, red, white, yellow } = chalk

export const logPrefix = '[MaprouletteRebuild]'

export async function maprouletteRebuildTasks(filter?: string | undefined) {
  console.log(logPrefix, 'START', filter ? `– ${yellow(`using filter "${filter}"`)}` : '')

  for await (const campaign of campaigns) {
    // SKIP WHEN MR OFF
    if (campaign.maprouletteChallenge.enabled === false) {
      console.log('\t', logPrefix, white('↷ SKIP'), campaign.id)
      continue
    }

    const saveParsed = CampaignMaprouletteSchema.parse(campaign) // Second time gets rid of the enabled=false
    const campaignId = saveParsed.maprouletteChallenge.id
    const challengeUrl = maprouletteChallengeUrl(campaignId)
    if (!campaignId) {
      console.log('\t', logPrefix, yellow('↷ SKIP'), 'No campaignId', campaignId)
      continue
    }

    // SKIP BY FILTER PARAM
    const skip = filter ? !campaign.id.includes(filter) : false
    const msgAction = skip ? yellow('↷ SKIP') : green('✎ PROCESS')
    console.log('\t', logPrefix, msgAction, campaign.id, gray(challengeUrl))
    if (skip) continue

    // ACTION
    const apiUrl = `https://maproulette.org/api/v2/challenge/${campaignId}/rebuild?removeUnmatched=true&skipSnapshot=true`
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { apiKey: process.env.MAPROULETTE_API_KEY!, accept: '*/*' },
    })

    if (!response.ok) {
      // https://github.com/maproulette/maproulette3/issues/2569
      if (response.status === 502 || response.status === 400) {
        const msgError = yellow('Server responded with "expected" error')
        console.log('\t\t', logPrefix, msgError, response.status, response.statusText)

        const status = await checkChallengeStatus(campaignId)
        if (status === 'failed') {
          console.log('\t\t', logPrefix, red('Rebuild failed for campaign'), campaign.id)
          continue
        }
      } else {
        const msgError = red('Failed to trigger rebuild for challenge')
        console.error('\t\t', logPrefix, msgError, response.statusText, response, apiUrl)
        continue
      }
    }

    console.log('\t\t', logPrefix, green('Rebuild finished'), campaign.id)
  }
}
