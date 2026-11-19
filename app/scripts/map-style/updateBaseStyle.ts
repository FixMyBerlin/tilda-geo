import { styleText } from 'node:util'
import {
  BACKGROUND_STYLE_IDS,
  maptilerEditorUrl,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/backgroundStyles.const'
import {
  anchorLayerProblems,
  baseStylePath,
  fetchBaseStyle,
  isSameStyle,
  readLocalBaseStyle,
} from './baseStyle'

let failed = false
for (const id of BACKGROUND_STYLE_IDS) {
  const remoteStyle = await fetchBaseStyle(id)

  const problem = anchorLayerProblems(remoteStyle)
  if (problem) {
    console.error(styleText('red', `${id}: the layers our layers are placed below are ${problem}`))
    console.error(
      `Not written. Fix the style in ${maptilerEditorUrl(id)} or its \`anchorsBefore\` in backgroundStyles.const.ts.`,
    )
    failed = true
    continue
  }

  const localStyle = await readLocalBaseStyle(id).catch(() => null)
  if (localStyle && isSameStyle(remoteStyle, localStyle)) {
    console.log(`${id}: up to date.`)
    continue
  }

  await Bun.write(baseStylePath(id), `${JSON.stringify(remoteStyle, null, 2)}\n`)
  console.log(styleText('green', 'Updated'), baseStylePath(id))
}

if (failed) process.exit(1)
console.log('Check the diff, then commit.')
