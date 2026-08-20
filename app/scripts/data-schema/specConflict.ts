import { isDeepStrictEqual } from 'node:util'
import * as p from '@clack/prompts'
import type { DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'

export type SpecOverwriteDirection = 'pull' | 'publish'

export function decideSpecOverwrite(input: {
  direction: SpecOverwriteDirection
  existing: DataSchemaSpec | null
  incoming: DataSchemaSpec
}) {
  if (!input.existing) {
    return { write: true, prompt: false, reason: 'missing' } as const
  }
  if (isDeepStrictEqual(input.existing, input.incoming)) {
    return { write: false, prompt: false, reason: 'same' } as const
  }
  return { write: true, prompt: true, reason: 'conflict' } as const
}

export function describeSpecConflict(input: { table: string; direction: SpecOverwriteDirection }) {
  return input.direction === 'pull'
    ? `Local spec.yaml for ${input.table} differs from S3. Pulling overwrites local spec.yaml with S3.`
    : `S3 spec for ${input.table} differs from local spec.yaml. Publishing overwrites the S3 spec with local spec.yaml.`
}

export async function resolveSpecOverwrite(input: {
  table: string
  direction: SpecOverwriteDirection
  existing: DataSchemaSpec | null
  incoming: DataSchemaSpec
  interactive?: boolean
}) {
  const interactive = input.interactive ?? Boolean(process.stdin.isTTY)
  const decision = decideSpecOverwrite(input)
  if (!decision.prompt) {
    return { write: decision.write, reason: decision.reason }
  }

  const message = describeSpecConflict({ table: input.table, direction: input.direction })

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
              label: 'Keep local spec.yaml',
              hint: 'do not pull this table',
            },
            {
              value: 'overwrite',
              label: 'Overwrite local with S3',
              hint: 'discards local spec.yaml edits',
            },
          ]
        : [
            {
              value: 'keep',
              label: 'Keep S3 spec',
              hint: 'do not upload local spec.yaml',
            },
            {
              value: 'overwrite',
              label: 'Overwrite S3 with local',
              hint: 'replaces spec.yaml',
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
