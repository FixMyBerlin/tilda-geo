import { styleText } from 'node:util'
import { ChallengeStatus } from './challengeStatus'
import { logPrefix } from './maprouletteRebuildTasks'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// We check the status of the challenge in order to learn if the rebuild actually worked
// and in order to slow down the script so we don't overwhelm the MR server.
// See https://github.com/maproulette/maproulette3/issues/2569
const RETRY_TIME_MS = 10 * 1000
const MAX_RETRIES = 50
export const checkChallengeStatus = async (campaignId: number, retries = 0) => {
  const tabPrefix = `\t\t\t${logPrefix}`

  const url = `https://maproulette.org/api/v2/challenge/${campaignId}`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.log(
        tabPrefix,
        styleText('red', '❌'),
        'Failed to fetch challenge status',
        response.status,
        response.statusText,
      )
      return 'max_retries_exceeded'
    }

    const challenge = await response.json()
    const challengeStatus = challenge.status

    if (retries >= MAX_RETRIES) {
      console.log(tabPrefix, styleText('red', `Challenge build failed after ${MAX_RETRIES} retries.`))
      return 'failed'
    }

    const msgWaiting = `Waiting for ${Math.round(RETRY_TIME_MS / 1000)} seconds…`
    const msgRetry = `${retries} / ${MAX_RETRIES}`
    switch (challengeStatus) {
      case ChallengeStatus.building:
        console.log(tabPrefix, styleText('blue', 'Challenge is rebuilding tasks.'), msgWaiting, msgRetry)
        await sleep(RETRY_TIME_MS)
        return checkChallengeStatus(campaignId, retries + 1)
      case ChallengeStatus.failed:
        console.log(tabPrefix, styleText('red', 'Challenge build failed.'))
        return 'failed'
      case ChallengeStatus.ready:
        console.log(tabPrefix, styleText('green', 'Challenge is ready.'))
        return 'ready'
      case ChallengeStatus.partiallyLoaded:
        console.log(tabPrefix, styleText('blue', 'Challenge is partially loaded.'), msgWaiting, msgRetry)
        await sleep(RETRY_TIME_MS)
        return checkChallengeStatus(campaignId, retries + 1)
      case ChallengeStatus.finished:
        console.log(tabPrefix, styleText('green', 'Challenge is finished.'))
        return 'finished'
      case ChallengeStatus.deletingTasks:
        console.log(tabPrefix, styleText('blue', 'Challenge is deleting tasks.'), msgWaiting, msgRetry)
        await sleep(RETRY_TIME_MS)
        return checkChallengeStatus(campaignId, retries + 1)
      case ChallengeStatus.none:
      case ChallengeStatus.empty:
      default:
        console.log(tabPrefix, styleText('red', 'ℹ️'), 'Challenge has no status or unknown status.')
        return 'failed'
    }
  } catch (error) {
    console.log(tabPrefix, styleText('red', 'Error fetching challenge status:'), error)
    return 'failed'
  }
}
