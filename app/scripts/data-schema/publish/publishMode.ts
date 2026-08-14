import * as p from '@clack/prompts'
import { differenceInHours, formatDistanceStrict, isValid, parseISO } from 'date-fns'

export const PUBLISH_MODES = ['override', 'snapshot'] as const
export type PublishMode = (typeof PUBLISH_MODES)[number]

/** Prompt when the current dump is at least this old (local CLI; major-version heuristic). */
const STALE_LATEST_HOURS = 24

function publishedAtDate(publishedAt: string) {
  const date = parseISO(publishedAt)
  return isValid(date) ? date : null
}

export function isLatestStale(publishedAt: string, now = new Date()) {
  const published = publishedAtDate(publishedAt)
  if (!published) return false
  return differenceInHours(now, published) >= STALE_LATEST_HOURS
}

export function formatLatestAge(publishedAt: string, now = new Date()) {
  const published = publishedAtDate(publishedAt)
  if (!published) return publishedAt
  return formatDistanceStrict(published, now, { addSuffix: true })
}

export function decidePublishMode(input: {
  explicitMode: PublishMode | undefined
  previousPublishedAt: string | null
  now?: Date
}) {
  if (input.explicitMode) {
    return { mode: input.explicitMode, prompt: false }
  }
  if (!input.previousPublishedAt) {
    return { mode: 'override' as const, prompt: false }
  }
  if (isLatestStale(input.previousPublishedAt, input.now)) {
    return { mode: 'snapshot' as const, prompt: true }
  }
  return { mode: 'override' as const, prompt: false }
}

export async function resolveWriteSnapshot(input: {
  explicitMode: PublishMode | undefined
  previousPublishedAt: string | null
  table: string
  now?: Date
  interactive?: boolean
}) {
  const interactive = input.interactive ?? Boolean(process.stdin.isTTY)
  const decision = decidePublishMode(input)

  if (!decision.prompt) {
    if (decision.mode === 'snapshot') {
      p.log.info('Mode: snapshot — copy current dump to snapshots/, then replace data.dump')
    } else if (input.previousPublishedAt) {
      p.log.info(
        `Mode: override — replace data.dump (${formatLatestAge(input.previousPublishedAt, input.now)})`,
      )
    } else {
      p.log.info('Mode: override — first publish')
    }
    return decision.mode === 'snapshot'
  }

  const age = formatLatestAge(input.previousPublishedAt!, input.now)
  if (!interactive) {
    p.log.warn(
      `Current data.${input.table} was published ${age}. Pass --mode snapshot to keep that version under snapshots/, or --mode override to replace data.dump only. Continuing with override.`,
    )
    return false
  }

  const selected = await p.select({
    message: `Current data.${input.table} was published ${age} (${input.previousPublishedAt}). Replace data.dump with this publish?`,
    initialValue: 'snapshot',
    options: [
      {
        value: 'snapshot',
        label: 'Archive current dump, then publish',
        hint: 'copies data.dump to snapshots/<when it was published>/, then overwrites the current files',
      },
      {
        value: 'override',
        label: 'Replace current dump only',
        hint: 'previous dump is not listed under snapshots/',
      },
    ],
  })
  if (p.isCancel(selected)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  if (selected === 'snapshot') {
    p.log.info('Mode: snapshot — copy current dump to snapshots/, then replace data.dump')
    return true
  }
  p.log.info('Mode: override — replace data.dump only')
  return false
}
