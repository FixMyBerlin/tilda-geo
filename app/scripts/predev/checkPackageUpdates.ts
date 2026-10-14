import { oncePerWeek } from './oncePerWeek'
import { logErr, logOk, logSkip, logWarn } from './predevLog'

const week = oncePerWeek('.lastchecked')

const label = 'Package updates'

export async function checkPackageUpdates() {
  try {
    const lastDate = await week.lastRunThisWeek()
    if (lastDate) {
      logSkip(label, `skipped (last checked ${lastDate}, next check after Sunday evening)`)
      return
    }

    const proc = Bun.spawn(['bunx', 'taze', 'major', '--includeLocked', '--maturity-period', '5'], {
      cwd: process.cwd(),
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ])
    await proc.exited

    await week.markRun()

    const hasUpdates = /→|outdated|upgrade/i.test(stdout) || /→|outdated|upgrade/i.test(stderr)
    if (hasUpdates) {
      logWarn(label, 'updates available — remember to run `bun run update`')
    } else {
      logOk(label)
    }
  } catch (e) {
    logErr(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

if (import.meta.main) {
  await checkPackageUpdates()
}
