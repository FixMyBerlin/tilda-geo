import { parseArgs, styleText } from 'node:util'
import { startOfDay } from 'date-fns'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import type { CampaignMaprouletteType } from '@/data/radinfra-de/schema/campaignsSchema.js'
import { CampaignMaprouletteSchema } from '@/data/radinfra-de/schema/campaignsSchema.js'
import { CAMPAIGN_API_BASE_URL } from '@/server/api/maproulette/campaignApiBaseUrl.const'
import { campaigns } from '../../src/data/radinfra-de/campaigns'
import { buildHashtags } from '../../src/data/radinfra-de/utils/buildHashtags'
import { getValidatedEnv, maprouletteSchema } from '../shared/env'
import { defaultChallenge } from './default.const'
import type { CreateMapRouletteChallengeType, UpdateMapRouletteChallengeType } from './schema'
import { CreateMapRouletteChallengeSchema, UpdateMapRouletteChallengeSchema } from './schema'
import { maprouletteChallengeUrl } from './utils/maprouletteChallengeUrl'

const maprouletteEnv = getValidatedEnv(maprouletteSchema)

// https://bun.sh/guides/process/argv
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    filter: { type: 'string' },
  },
  strict: true,
  allowPositionals: true,
})

function dataCreateChallenge({ id, ...astroCampaignData }: CampaignMaprouletteType) {
  const hashtags = buildHashtags(id, astroCampaignData.category, true)
  const challengeData: CreateMapRouletteChallengeType = {
    ...defaultChallenge,
    name: astroCampaignData.title,
    infoLink: `https://radinfra.de/kampagnen/${id}/`,
    remoteGeoJson: `${CAMPAIGN_API_BASE_URL}${id}`,
    enabled: astroCampaignData.maprouletteChallenge.enabled,
    description: astroCampaignData.description,
    checkinComment: `${astroCampaignData.maprouletteChallenge.checkinComment}  ${hashtags.join(' ')}`,
    checkinSource: astroCampaignData.maprouletteChallenge.checkinSource,
    dataOriginDate: startOfDay(new Date()).toISOString(), // We skip this; the tasks have their own updatedAt at the bottom of the task description
  }
  return CreateMapRouletteChallengeSchema.parse(challengeData)
}

function dataUpdateChallenge({ id, ...astroCampaignData }: CampaignMaprouletteType) {
  invariant(
    astroCampaignData.maprouletteChallenge.id,
    'challenge.id is required dataUpdateChallenge',
  )

  const challengeData: UpdateMapRouletteChallengeType = {
    ...dataCreateChallenge({ id, ...astroCampaignData }),
    id: astroCampaignData.maprouletteChallenge.id,
  }
  return UpdateMapRouletteChallengeSchema.parse(challengeData)
}

async function updateChallenge(challenge: UpdateMapRouletteChallengeType) {
  const response = await fetch(`https://maproulette.org/api/v2/challenge/${challenge.id}`, {
    method: 'PUT',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      apiKey: maprouletteEnv.MAPROULETTE_API_KEY,
    },
    body: JSON.stringify(challenge),
  })

  if (!response.ok) {
    const error = `Failed to update challenge: ${response.statusText}`
    console.error(error, await response.json(), response)
    throw new Error(error)
  }

  const data = await response.json()
  // console.log('Challenge updated', data)
  return data
}

async function createChallenge(challenge: CreateMapRouletteChallengeType) {
  const response = await fetch('https://maproulette.org/api/v2/challenge', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      apiKey: maprouletteEnv.MAPROULETTE_API_KEY,
    },
    body: JSON.stringify(challenge),
  })

  if (!response.ok) {
    const error = `Failed to create challenge: ${response.statusText}`
    console.error(error, await response.json(), response)
    throw new Error(error)
  }

  const data = await response.json()
  // console.log('Challenge created', data)
  return data
}

async function main(filter: string | undefined) {
  for await (const campaign of campaigns) {
    // SKIP WHEN MR OFF
    if (campaign.maprouletteChallenge.enabled === false) {
      console.log('\t', styleText('gray', '↷ SKIP'), campaign.id, '(No MapRoulette)')
      continue
    }

    // SKIP BY FILTER PARAM
    const skip = filter ? !campaign.id.includes(filter) : false
    const logPrefix = skip ? styleText('yellow', '↷ SKIP') : styleText('green', '✎ PROCESS')
    console.log('\t', logPrefix, campaign.id)
    if (skip) continue

    // ACTION
    const saveParsed = CampaignMaprouletteSchema.parse(campaign)
    const action = saveParsed.maprouletteChallenge.id ? 'UPDATE' : 'CREATE'

    switch (action) {
      case 'CREATE': {
        const createData = dataCreateChallenge(saveParsed)
        const challenge = await createChallenge(createData)
        const parsed = z.object({ id: z.number() }).parse(challenge)
        console.log('\t\t', 'CREATED campaign', maprouletteChallengeUrl(parsed.id))
        console.log('\t\t', `NOW UPDATE campaign ${saveParsed.id} with MapRoulette ID`, parsed.id)
        break
      }
      case 'UPDATE': {
        const updateData = dataUpdateChallenge(saveParsed)
        await updateChallenge(updateData)
        console.log('\t\t', 'UPDATED campaign', maprouletteChallengeUrl(updateData.id))
        break
      }
    }
  }

  // // FORMATTING
  // $`prettier 'src/content/campaigns/**/*.json' --write`
}

console.log(
  'STARTING MaprouletteCreate',
  values.filter ? `–${styleText('yellow', ` using filter "${values.filter}"`)}` : '',
)
main(values.filter)
