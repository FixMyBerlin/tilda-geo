import { fetchBaseStyle, isSameStyle, readLocalBaseStyle } from '../map-style/baseStyle'
import { oncePerWeek } from './oncePerWeek'
import { logOk, logSkip, logWarn } from './predevLog'

const label = 'Base map style'
const week = oncePerWeek('.lastchecked-base-style')

/** Warns when the style in Maptiler differs from our copy. Never blocks `bun run dev`. */
export async function checkBaseStyle() {
  const lastDate = await week.lastRunThisWeek()
  if (lastDate) {
    logSkip(label, `skipped (last checked ${lastDate}, next check after Sunday evening)`)
    return
  }

  try {
    const [remoteStyle, localStyle] = await Promise.all([fetchBaseStyle(), readLocalBaseStyle()])
    if (isSameStyle(remoteStyle, localStyle)) {
      logOk(label)
    } else {
      logWarn(label, 'the style in Maptiler changed — run `bun run map-style-update`')
    }
  } catch (e) {
    logSkip(label, `could not compare (${e instanceof Error ? e.message : String(e)})`)
  }
  // Also after a failure: this check only warns and should not slow down every start.
  await week.markRun()
}

if (import.meta.main) {
  await checkBaseStyle()
}
