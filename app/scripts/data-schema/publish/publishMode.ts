import * as p from '@clack/prompts'

export const PUBLISH_MODES = ['override', 'snapshot'] as const
export type PublishMode = (typeof PUBLISH_MODES)[number]

/** Prompt when previous latest/ is at least this old (laptop CLI; major-version heuristic). */
export const STALE_LATEST_MS = 24 * 60 * 60 * 1000

export function daysSincePublished(publishedAt: string, now = new Date()) {
  const publishedMs = Date.parse(publishedAt)
  if (Number.isNaN(publishedMs)) return null
  return (now.getTime() - publishedMs) / STALE_LATEST_MS
}

export function isLatestStale(publishedAt: string, now = new Date()) {
  const days = daysSincePublished(publishedAt, now)
  return days !== null && days >= 1
}

export function formatLatestAge(publishedAt: string, now = new Date()) {
  const days = daysSincePublished(publishedAt, now)
  if (days === null) return publishedAt
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24))
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const wholeDays = Math.round(days)
  return `${wholeDays} day${wholeDays === 1 ? '' : 's'} ago`
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
      p.log.info('Mode: snapshot — replace latest/ and write snapshots/<UTC>/')
    } else if (input.previousPublishedAt) {
      p.log.info(
        `Mode: override — replace latest/ (${formatLatestAge(input.previousPublishedAt, input.now)})`,
      )
    } else {
      p.log.info('Mode: override — first publish, writing latest/ only')
    }
    return decision.mode === 'snapshot'
  }

  const age = formatLatestAge(input.previousPublishedAt!, input.now)
  if (!interactive) {
    p.log.warn(
      `Latest data.${input.table} was published ${age}. Pass --mode snapshot to keep a recoverable copy, or --mode override to silence this. Continuing with override.`,
    )
    return false
  }

  const selected = await p.select({
    message: `Latest data.${input.table} was published ${age} (${input.previousPublishedAt}). Publish always replaces latest/. Also keep a snapshot of this publish?`,
    initialValue: 'snapshot',
    options: [
      {
        value: 'snapshot',
        label: 'Snapshot this publish',
        hint: 'latest + snapshots/<UTC>/ — import later from admin',
      },
      {
        value: 'override',
        label: 'Override latest only',
        hint: 'replace latest/; previous is not listed under snapshots/',
      },
    ],
  })
  if (p.isCancel(selected)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  if (selected === 'snapshot') {
    p.log.info('Mode: snapshot — replace latest/ and write snapshots/<UTC>/')
    return true
  }
  p.log.info('Mode: override — replace latest/ only')
  return false
}
