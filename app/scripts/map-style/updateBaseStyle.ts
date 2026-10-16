import { styleText } from 'node:util'
import {
  BASE_STYLE_PATH,
  fetchBaseStyle,
  isSameStyle,
  missingAnchorLayers,
  readLocalBaseStyle,
} from './baseStyle'

const remoteStyle = await fetchBaseStyle()

const missing = missingAnchorLayers(remoteStyle)
if (missing.length) {
  console.error(
    styleText('red', 'The Maptiler style lacks layers that our layers are placed below:'),
    missing.join(', '),
  )
  console.error('Nothing was written. Add them in Maptiler or change `LAYER_POSITIONS`.')
  process.exit(1)
}

if (isSameStyle(remoteStyle, await readLocalBaseStyle())) {
  console.log('The base style is up to date.')
  process.exit(0)
}

await Bun.write(BASE_STYLE_PATH, `${JSON.stringify(remoteStyle, null, 2)}\n`)
console.log(styleText('green', 'Updated'), BASE_STYLE_PATH)
console.log('Check the diff, then commit.')
