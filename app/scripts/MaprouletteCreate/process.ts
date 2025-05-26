import {
  CampaignMaprouletteSchema,
  CampaignMaprouletteType,
} from '@/src/data/radinfra-de/schema/campaignsSchema.js'
import { startOfDay } from 'date-fns'
import invariant from 'tiny-invariant'
import { parseArgs } from 'util'
import { z } from 'zod'
import { campaigns } from '../../src/data/radinfra-de/campaigns'
import { buildHashtags } from '../../src/data/radinfra-de/utils/buildHashtags'
import { defaultChallenge } from './default.const'
import {
  CreateMapRouletteChallengeSchema,
  UpdateMapRouletteChallengeSchema,
  type CreateMapRouletteChallengeType,
  type UpdateMapRouletteChallengeType,
} from './schema'
import { maprouletteChallengeUrl } from './utils/maprouletteChallengeUrl'
import { maprouletteRemoteGeoJsonUrl } from './utils/maprouletteRemoteGeoJsonUrl'

// https://bun.sh/guides/process/argv
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    filter: { type: 'string' },
  },
  strict: true,
  allowPositionals: true,
})

function dataCreateChallenge({
  id,
  todoKey,
  maprouletteChallenge,
  ...astroCampaignData
}: CampaignMaprouletteType) {
  const hashtags = buildHashtags(todoKey, astroCampaignData.category, true)

  const challengeData: CreateMapRouletteChallengeType = {
    ...defaultChallenge,
    name: astroCampaignData.title,
    infoLink: `https://radinfra.de/kampagnen/${id}/`,
    remoteGeoJson: maprouletteRemoteGeoJsonUrl(todoKey, maprouletteChallenge),
    enabled: maprouletteChallenge.enabled,
    description: astroCampaignData.description,
    checkinComment: `${maprouletteChallenge.checkinComment}  ${hashtags.join(' ')}`,
    checkinSource: maprouletteChallenge.checkinSource,
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
      apiKey: process.env.MAPROULETTE_API_KEY!,
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
      apiKey: process.env.MAPROULETTE_API_KEY!,
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
      console.log('\t', '\x1b[37m↷ SKIP\x1b[0m', campaign.id, '(No MapRoulette)')
      continue
    }

    // SKIP BY FILTER PARAM
    const skip = filter ? !campaign.id.includes(filter) : false
    const logPrefix = skip ? '\x1b[33m↷ SKIP\x1b[0m' : '\x1b[32m✎ PROCESS\x1b[0m'
    console.log('\t', logPrefix, campaign.id)
    if (skip) continue

    // ACTION
    const saveParsed = CampaignMaprouletteSchema.parse(campaign)
    const action = saveParsed.maprouletteChallenge.id ? 'UPDATE' : 'CREATE'

    switch (action) {
      case 'CREATE':
        const createData = dataCreateChallenge(saveParsed)
        const challenge = await createChallenge(createData)
        // Write back the ID into the given Keystatic Content file
        const { id } = z.object({ id: z.number() }).parse(challenge)

        // TODO: Readd the part where we write back the mr-id to the local data automatically
        console.log('\t\t', 'CREATED campaign', maprouletteChallengeUrl(id))
        console.log('\t\t', `NOW UPDATE campaign ${saveParsed.id} with MapRoulette ID`, id)
        break
      case 'UPDATE':
        const updateData = dataUpdateChallenge(saveParsed)
        await updateChallenge(updateData)
        console.log('\t\t', 'UPDATED campaign', maprouletteChallengeUrl(updateData.id))
        break
    }
  }

  // // FORMATTING
  // $`prettier 'src/content/campaigns/**/*.json' --write`
}

console.log(
  'STARTING MaprouletteCreate',
  values.filter ? `–\x1b[33m using filter \"${values.filter}\"\x1b[0m` : '',
)
main(values.filter)
