import { styleText } from 'node:util'
import { confirm, isCancel, note } from '@clack/prompts'
import { $ } from 'bun'
import { applyDevPortSlotToProcessEnv, exitOnInvalidDevPortSlot } from './devPortSlot'
import { isAttachMode } from './ensureDevStack'
import { devStackSkillHint, logErr, logOk } from './predevLog'

const label = 'check_migration'

const pendingMigrationsBanner = 'Following migrations have not yet been applied'

const pendingMigrationsTipBody = `From the \`app\` directory run:

  bun run migrate

Then start the dev server again.`

const pendingMigrationsError = 'Pending database migrations.'

// A worktree's own stack starts empty, so every migration is pending there.
const ownStackTipBody = `This worktree runs its own database (DEV_STACK_ID), which starts empty.
To work on the data of develop, attach to its stack: set \`DEV_ATTACH_STACK=default\`
in .env.local (plus \`DEV_PORT_SLOT\` when port 5173 is taken).
${devStackSkillHint}`

function showPendingMigrationsTip() {
  note(pendingMigrationsTipBody, 'Tip')
  if (process.env.DEV_STACK_ID?.trim() && !isAttachMode()) note(ownStackTipBody, 'Own stack')
}

export async function checkMigration() {
  try {
    exitOnInvalidDevPortSlot(label)
    applyDevPortSlotToProcessEnv()
    // `prisma migrate status` exits 1 when migrations are pending; Bun `$` would throw before we can read stdout.
    const result = await $`bun run migrate-check`.quiet().nothrow()
    const output = result.text()

    if (!output.includes(pendingMigrationsBanner)) {
      if (result.exitCode === 0) {
        logOk(label)
        return
      }
      throw new Error(
        output.trim() || `migrate-check failed with exit code ${result.exitCode ?? 'unknown'}`,
      )
    }

    console.error(styleText('red', 'There are pending migrations.'))

    if (Bun.argv.includes('--non-interactive')) {
      showPendingMigrationsTip()
      throw new Error(pendingMigrationsError)
    }

    const apply = await confirm({
      message: 'Apply them now?',
    })
    if (isCancel(apply)) {
      throw new Error('Cancelled')
    }
    if (!apply) {
      showPendingMigrationsTip()
      throw new Error(pendingMigrationsError)
    }

    const migrateProc = Bun.spawn(['bun', 'run', 'migrate'], {
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
