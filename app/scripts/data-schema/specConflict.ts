import * as p from '@clack/prompts'
import { formatDistanceStrict, isValid, parseISO } from 'date-fns'
import type { DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'

export type SpecOverwriteDirection = 'pull' | 'publish'

function updatedAtMs(updatedAt: string | undefined) {
  if (!updatedAt) return 0
  const date = parseISO(updatedAt)
  return isValid(date) ? date.getTime() : 0
}

export function decideSpecOverwrite(input: {
  direction: SpecOverwriteDirection
  existing: DataSchemaSpec | null
  incoming: DataSchemaSpec
}) {
  if (!input.existing) {
    return { write: true, prompt: false, reason: 'missing' } as const
  }
  const existingMs = updatedAtMs(input.existing.updatedAt)
  const incomingMs = updatedAtMs(input.incoming.updatedAt)
  if (incomingMs > existingMs) {
    return { write: true, prompt: false, reason: 'incoming-newer' } as const
  }
  if (incomingMs < existingMs) {
    return { write: true, prompt: true, reason: 'conflict' } as const
  }
  if (input.direction === 'publish') {
    return { write: true, prompt: false, reason: 'same' } as const
  }
  return { write: false, prompt: false, reason: 'same' } as const
}

export function formatSpecUpdatedAt(updatedAt: string | undefined, now = new Date()) {
  if (!updatedAt) return 'no updatedAt (never published)'
  const date = parseISO(updatedAt)
  if (!isValid(date)) return updatedAt
  return `${formatDistanceStrict(date, now, { addSuffix: true })} (${updatedAt})`
}

export function describeSpecConflict(input: {
  table: string
  direction: SpecOverwriteDirection
  existing: DataSchemaSpec
  incoming: DataSchemaSpec
  now?: Date
}) {
  const now = input.now ?? new Date()
  const existingName = input.direction === 'pull' ? 'local spec.json' : 'S3 spec'
  const incomingName = input.direction === 'pull' ? 'S3 spec' : 'local spec.json'
  const headline =
    input.direction === 'pull'
      ? `Local spec.json for ${input.table} has a newer updatedAt than S3.`
      : `S3 spec for ${input.table} has a newer updatedAt than local spec.json.`
  const consequence =
    input.direction === 'pull'
      ? 'Pulling overwrites local spec.json with S3.'
      : 'Publishing overwrites the S3 spec with local spec.json (and stamps a new updatedAt).'
  return [
    headline,
    `  ${existingName}: ${formatSpecUpdatedAt(input.existing.updatedAt, now)}`,
    `  ${incomingName}: ${formatSpecUpdatedAt(input.incoming.updatedAt, now)}`,
    consequence,
  ].join('\n')
}

export async function resolveSpecOverwrite(input: {
  table: string
  direction: SpecOverwriteDirection
  existing: DataSchemaSpec | null
  incoming: DataSchemaSpec
  interactive?: boolean
  now?: Date
}) {
  const interactive = input.interactive ?? Boolean(process.stdin.isTTY)
  const decision = decideSpecOverwrite(input)
  if (!decision.prompt) {
    return { write: decision.write, reason: decision.reason }
  }

  const message = describeSpecConflict({
    table: input.table,
    direction: input.direction,
    existing: input.existing!,
    incoming: input.incoming,
    now: input.now,
  })

  if (!interactive) {
    if (input.direction === 'publish') {
      throw new Error(
        `${message}\nRe-run on a TTY to confirm overwriting S3, or data-schema-pull if S3 should win.`,
      )
    }
    p.log.warn(`${message}\nSkipping ${input.table} (local spec kept).`)
    return { write: false, reason: 'kept' as const }
  }

  const selected = await p.select({
    message,
    initialValue: 'keep',
    options:
      input.direction === 'pull'
        ? [
            {
              value: 'keep',
              label: 'Keep local spec.json',
              hint: 'do not pull this table',
            },
            {
              value: 'overwrite',
              label: 'Overwrite local with S3',
              hint: 'discards local spec.json edits',
            },
          ]
        : [
            {
              value: 'keep',
              label: 'Keep S3 spec',
              hint: 'do not upload local spec.json',
            },
            {
              value: 'overwrite',
              label: 'Overwrite S3 with local',
              hint: 'replaces sources/spec.json and stamps a new updatedAt',
            },
          ],
  })
  if (p.isCancel(selected)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  if (selected === 'overwrite') {
    return { write: true, reason: 'overwritten' as const }
  }
  return { write: false, reason: 'kept' as const }
}
