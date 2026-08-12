#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { type Subcommand, SUBCOMMANDS, printRootHelp } from './args'
import { runImportRaw } from './import-raw'
import { runPublish } from './publish'
import { runPublishSpec } from './publish-spec'
import { runSync } from './sync'

function stripDoubleDash(argv: string[]) {
  return argv.filter((arg) => arg !== '--')
}

async function main() {
  const argv = stripDoubleDash(Bun.argv.slice(2))
  const command = argv[0]

  if (!command || command === '--help' || command === '-h') {
    printRootHelp()
    return
  }

  if (!SUBCOMMANDS.includes(command as Subcommand)) {
    printRootHelp()
    throw new Error(`Unknown command: ${command}`)
  }

  const commandArgv = argv.slice(1)

  switch (command as Subcommand) {
    case 'sync':
      await runSync(commandArgv)
      break
    case 'publish-spec':
      await runPublishSpec(commandArgv)
      break
    case 'import-raw':
      await runImportRaw(commandArgv)
      break
    case 'publish':
      await runPublish(commandArgv)
      break
  }
}

main().catch((error) => {
  p.log.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
