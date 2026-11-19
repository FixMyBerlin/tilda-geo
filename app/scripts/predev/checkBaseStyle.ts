import { BACKGROUND_STYLE_IDS } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/backgroundStyles.const'
import { fetchBaseStyle, isSameStyle, readLocalBaseStyle } from '../map-style/baseStyle'
import { oncePerWeek } from './oncePerWeek'
import { logOk, logSkip, logWarn } from './predevLog'

const label = 'Base map styles'
const week = oncePerWeek('.lastchecked-base-style')

/** Warns when a style in Maptiler differs from our copy. Never blocks `bun run dev`. */
export async function checkBaseStyle() {
  const lastDate = await week.lastRunThisWeek()
  if (lastDate) {
    logSkip(label, `skipped (last checked ${lastDate}, next check after Sunday evening)`)
    return
  }

  try {
    const changed: string[] = []
    for (const id of BACKGROUND_STYLE_IDS) {
      const [remoteStyle, localStyle] = await Promise.all([
        fetchBaseStyle(id),
        readLocalBaseStyle(id),
      ])
      if (!isSameStyle(remoteStyle, localStyle)) changed.push(id)
    }
    if (changed.length) {
      logWarn(
        label,
        `changed in Maptiler: ${changed.join(', ')} — run \`bun run map-style-update\``,
      )
    } else {
      logOk(label)
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
