import { styleText } from 'node:util'
import { confirm, isCancel } from '@clack/prompts'
import { $ } from 'bun'
import { logErr, logOk } from './predevLog'

const label = 'check_migration'

export async function checkMigration() {
  try {
    const result = await $`npm run migrate-check`.quiet()
    const output = result.text()

    if (!output.includes('Following migration have not yet been applied')) {
      logOk(label)
      return
    }

    console.error(styleText('red', 'There are pending migrations.'))

    const apply = await confirm({
      message: 'Apply them now?',
    })
    if (isCancel(apply)) {
      throw new Error('Cancelled')
    }
    if (!apply) {
      throw new Error('Pending migrations (run `npm run migrate` before starting the server)')
    }

    const migrateProc = Bun.spawn(['npm', 'run', 'migrate'], {
      cwd: process.cwd(),
      stdout: 'inherit',
      stderr: 'inherit',
      stdin: 'inherit',
    })
    const migrateExit = await migrateProc.exited
    if (migrateExit !== 0) {
      throw new Error(`migrate failed with exit code ${migrateExit}`)
    }
    logOk(label)
  } catch (e) {
    logErr(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

if (import.meta.main) {
  await checkMigration()
}
