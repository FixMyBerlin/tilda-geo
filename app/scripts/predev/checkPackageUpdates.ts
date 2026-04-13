import path from 'node:path'
import { TZDate } from '@date-fns/tz'
import { isSameWeek } from 'date-fns'
import { logErr, logOk, logSkip, logWarn } from './predevLog'

const TZ = 'Europe/Berlin'
const LAST_CHECKED_PATH = path.join(import.meta.dir, '.lastchecked')

const label = 'Package updates'

export async function checkPackageUpdates() {
  try {
    const now = new TZDate(new Date(), TZ)

    let lastChecked: TZDate | null = null
    try {
      const content = await Bun.file(LAST_CHECKED_PATH).text()
      const trimmed = content.trim()
      if (trimmed) lastChecked = new TZDate(new Date(trimmed), TZ)
    } catch {
      // no file or invalid
    }

    if (lastChecked && isSameWeek(now, lastChecked, { weekStartsOn: 0 })) {
      const lastDate = lastChecked.toISOString().slice(0, 10)
      logSkip(label, `skipped (last checked ${lastDate}, next check after Sunday evening)`)
      return
    }

    const proc = Bun.spawn(['bunx', 'taze', 'major', '--includeLocked'], {
      cwd: process.cwd(),
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ])
    await proc.exited

    await Bun.write(LAST_CHECKED_PATH, new Date().toISOString())

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
