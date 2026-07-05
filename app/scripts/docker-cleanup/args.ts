import { parseArgs } from 'node:util'
import { z } from 'zod'

const cliValuesSchema = z.object({
  help: z.boolean().default(false),
  quick: z.boolean().default(false),
  dryRun: z.boolean().default(false),
})

export function parseDockerCleanupArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      help: { type: 'boolean', short: 'h' },
      quick: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
    },
    allowPositionals: true,
    strict: true,
  })
  return cliValuesSchema.parse({
    help: values.help,
    quick: values.quick,
    dryRun: values['dry-run'],
  })
}

export function printDockerCleanupHelp() {
  process.stdout.write(`docker-cleanup

Free Docker disk space with safe defaults pre-selected.

Usage:
  bun run docker-cleanup
  bun run docker-cleanup -- --quick
  bun run docker-cleanup -- --dry-run

Options:
  --quick     Run pre-selected safe cleanup without prompts
  --dry-run   Show plan and reclaimable space without changes
  -h, --help  Show this message

Pre-selected (recommended): stopped containers, dangling images, unused build cache.
`)
}
