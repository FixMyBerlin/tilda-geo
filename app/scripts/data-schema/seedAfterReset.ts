#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { runPull } from './pull/index'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export async function seedDataSchemaAfterReset() {
  try {
    await runPull([])
  } catch (error) {
    p.log.warn(
      `data-schema-pull skipped: ${errorMessage(error)}. Run bun run data-schema-pull later.`,
    )
  }

  p.log.info('To restore data.* dumps, Import on /admin/data-schema')
}

if (import.meta.main) {
  try {
    await seedDataSchemaAfterReset()
  } catch (error) {
    p.log.error(errorMessage(error))
    process.exit(1)
  }
}
