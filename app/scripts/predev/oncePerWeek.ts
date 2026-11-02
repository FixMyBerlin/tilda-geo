import path from 'node:path'
import { TZDate } from '@date-fns/tz'
import { isSameWeek } from 'date-fns'

const TZ = 'Europe/Berlin'

/** Remembers in a gitignored file next to the predev scripts when a check last ran. */
export const oncePerWeek = (stateFileName: string) => {
  const statePath = path.join(import.meta.dir, stateFileName)

  return {
    /** The date of the last run when it was in the current week, otherwise `null`. */
    async lastRunThisWeek() {
      try {
        const content = (await Bun.file(statePath).text()).trim()
        if (!content) return null
        const lastChecked = new TZDate(new Date(content), TZ)
        const now = new TZDate(new Date(), TZ)
        if (!isSameWeek(now, lastChecked, { weekStartsOn: 0 })) return null
        return lastChecked.toISOString().slice(0, 10)
      } catch {
        // no file or invalid
        return null
      }
    },
    async markRun() {
      await Bun.write(statePath, new Date().toISOString())
    },
  }
}
