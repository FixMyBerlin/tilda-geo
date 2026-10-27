import path from 'node:path'
import { styleText } from 'node:util'
import sharp from 'sharp'
import { SPRITE_FOLDER, computeSpriteVersion } from './spriteVersion'

// Builds the map sprite from the SVG files in `./icons`. The file name is the icon id.
// See `./README.md`.

const ICONS_FOLDER = path.join(import.meta.dir, 'icons')
const OVERVIEW_PATH = path.join(import.meta.dir, 'icons-overview.png')
const VERSION_PATH = path.join(
  import.meta.dir,
  '../../src/server/api/map-style/spriteVersion.const.ts',
)

const SHEET_WIDTH = 256
const GAP = 1

type Icon = { id: string; svg: string; width: number; height: number }
type Placement = Icon & { x: number; y: number }

const readIcons = async () => {
  const fileNames = Array.from(new Bun.Glob('*.svg').scanSync(ICONS_FOLDER)).sort()
  const icons: Icon[] = []
  for (const fileName of fileNames) {
    const id = fileName.replace(/\.svg$/, '')
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`${fileName}: icon ids are kebab-case (a-z, 0-9, -)`)
    }
    const svg = await Bun.file(path.join(ICONS_FOLDER, fileName)).text()
    const width = Number(svg.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1])
    const height = Number(svg.match(/<svg[^>]*\sheight="([\d.]+)"/)?.[1])
    if (!width || !height) {
      throw new Error(`${fileName}: the <svg> needs a width and height in pixels`)
    }
    icons.push({ id, svg, width, height })
  }
  return icons
}

/** Rows of icons, tallest first. The same layout is used for every pixel ratio. */
const placeIcons = (icons: Icon[]) => {
  const sorted = [...icons].sort((a, b) => b.height - a.height || a.id.localeCompare(b.id))
  const placements: Placement[] = []
  let x = 0
  let y = 0
  let rowHeight = 0
  for (const icon of sorted) {
    const width = Math.ceil(icon.width)
    if (x > 0 && x + width > SHEET_WIDTH) {
      x = 0
      y += rowHeight + GAP
      rowHeight = 0
    }
    placements.push({ ...icon, x, y })
    x += width + GAP
    rowHeight = Math.max(rowHeight, Math.ceil(icon.height))
  }
  return { placements, sheetHeight: y + rowHeight }
}

const renderIcon = (icon: Icon, pixelRatio: number) => {
  const width = Math.floor(icon.width * pixelRatio)
  const height = Math.floor(icon.height * pixelRatio)
  // 72 dpi renders one SVG pixel as one image pixel.
  return sharp(Buffer.from(icon.svg), { density: 72 * pixelRatio })
    .resize({ width, height, fit: 'fill' })
    .png()
    .toBuffer()
    .then((input) => ({ input, width, height }))
}

const writeSprite = async (placements: Placement[], sheetHeight: number, pixelRatio: number) => {
  const index: Record<string, object> = {}
  const composites = []
  const rendered = new Map<string, Buffer>()
  for (const icon of placements) {
    const { input, width, height } = await renderIcon(icon, pixelRatio)
    rendered.set(icon.id, input)
    const left = icon.x * pixelRatio
    const top = icon.y * pixelRatio
    composites.push({ input, left, top })
    index[icon.id] = { width, height, x: left, y: top, pixelRatio }
  }

  const baseName = path.join(SPRITE_FOLDER, pixelRatio === 1 ? 'sprite' : `sprite@${pixelRatio}x`)
  await sharp({
    create: {
      width: SHEET_WIDTH * pixelRatio,
      height: sheetHeight * pixelRatio,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(`${baseName}.png`)
  await Bun.write(`${baseName}.json`, `${JSON.stringify(index, null, 2)}\n`)
  return rendered
}

/** All icons with their id on a map-like background, to look at them in the repo. */
const writeOverview = async (icons: Icon[], rendered2x: Map<string, Buffer>) => {
  const columns = 6
  const cell = { width: 190, height: 96 }
  const composites = []
  for (const [i, icon] of icons.entries()) {
    const left = (i % columns) * cell.width + 12
    const top = Math.floor(i / columns) * cell.height + 12
    const fitted = await sharp(rendered2x.get(icon.id))
      .resize({ width: cell.width - 24, height: 48, fit: 'inside', withoutEnlargement: true })
      .toBuffer()
    composites.push({ input: fitted, left, top })
    const label = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell.width - 12}" height="30">
      <text x="0" y="12" font-size="11" font-family="Helvetica, Arial, sans-serif" fill="#1f2937">${icon.id}</text>
      <text x="0" y="26" font-size="10" font-family="Helvetica, Arial, sans-serif" fill="#6b7280">${icon.width} × ${icon.height}</text>
    </svg>`
    composites.push({ input: Buffer.from(label), left, top: top + 54 })
  }
  await sharp({
    create: {
      width: columns * cell.width + 12,
      height: Math.ceil(icons.length / columns) * cell.height + 12,
      channels: 4,
      background: '#e5e3df',
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(OVERVIEW_PATH)
}

const icons = await readIcons()
const { placements, sheetHeight } = placeIcons(icons)
await writeSprite(placements, sheetHeight, 1)
const rendered2x = await writeSprite(placements, sheetHeight, 2)
await writeOverview(icons, rendered2x)
const version = computeSpriteVersion()
await Bun.write(
  VERSION_PATH,
  `// Generated by \`bun run map-sprite-build\`. See \`scripts/map-style/spriteVersion.ts\`.\nexport const SPRITE_VERSION = '${version}'\n`,
)
console.log(
  styleText('green', 'Built'),
  `${icons.length} icons into ${SPRITE_FOLDER}, version ${version}`,
)
