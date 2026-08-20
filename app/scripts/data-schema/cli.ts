import * as p from '@clack/prompts'

function cliArgv() {
  return Bun.argv.slice(2).filter((arg) => arg !== '--')
}

export async function runCli(run: (argv: string[]) => Promise<void>) {
  try {
    await run(cliArgv())
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
