import { join } from 'node:path'
import { favicons } from 'favicons'
import { APP_META } from '../../src/meta.const'

const source = join(process.cwd(), 'public', 'favicon.svg')
const dest = join(process.cwd(), 'public')

const display = 'standalone' as const
const startUrl = '/'

const config = {
  path: '/',
  lang: 'de',
  appName: APP_META.title,
  appShortName: APP_META.shortName,
  appDescription: APP_META.description,
  theme_color: APP_META.themeColor,
  background: APP_META.themeColor,
  display,
  start_url: startUrl,
  icons: {
    android: ['android-chrome-192x192.png', 'android-chrome-512x512.png'],
    appleIcon: ['apple-touch-icon.png'],
    appleStartup: false,
    favicons: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png'],
    windows: false,
    yandex: false,
  },
}

async function main() {
  const exists = await Bun.file(source).exists()
  if (!exists) {
    console.error('Source not found:', source)
    process.exit(1)
  }

  const response = await favicons(source, config)

  for (const img of response.images) {
    const outPath = join(dest, img.name)
    await Bun.write(outPath, img.contents)
    console.log('Wrote', img.name)
  }
  for (const file of response.files) {
    const outPath = join(dest, file.name)
    await Bun.write(outPath, file.contents)
    console.log('Wrote', file.name)
  }

  const manifestJson = {
    short_name: config.appShortName,
    name: config.appName,
    icons: [
      { src: 'favicon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
      { src: 'favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' },
      { src: 'android-chrome-192x192.png', type: 'image/png', sizes: '192x192' },
      { src: 'android-chrome-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    start_url: config.start_url,
    display: config.display,
    theme_color: config.theme_color,
    background_color: config.background,
  }
  await Bun.write(join(dest, 'manifest.json'), JSON.stringify(manifestJson, null, 2))
  console.log('Wrote manifest.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
