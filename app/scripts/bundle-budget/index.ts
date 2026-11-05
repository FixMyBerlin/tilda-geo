// Checks the JS and CSS a first page load preloads per route against a gzip budget.
// Reads the route manifest TanStack Start embeds in the server bundle, so it needs a fresh
// `bun run build` but no running server or database.
// Usage: bun scripts/bundle-budget/index.ts [--report] [--route <routeId>]
//   --report  also lists the largest chunks and the source modules they contain
//   --route   reports one route from `routeTree.gen.ts` instead of checking the budgets
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { gzipSync } from 'node:zlib'
import { addChunkSourceBytes } from './sourceMapAttribution'

type ManifestRoute = { children?: string[]; preloads?: string[]; css?: string[] }
type Budget = { routeId: string; maxJsKiB: number; maxPreloads: number }

// Route ids as in `routeTree.gen.ts`. Budgets sit about 5 % above the size measured on 2026-11-05,
// so a leak of map or admin code into the shared chunks fails the check. Lower them when a change
// makes a route smaller; raise them only for code the route really needs on first load.
const budgets: Budget[] = [
  { routeId: '/', maxJsKiB: 370, maxPreloads: 95 },
  { routeId: '/_pages/datenschutz', maxJsKiB: 330, maxPreloads: 92 },
  { routeId: '/_pages/docs/$tableName', maxJsKiB: 435, maxPreloads: 106 },
  { routeId: '/regionen/', maxJsKiB: 330, maxPreloads: 95 },
  { routeId: '/regionen/$regionSlug', maxJsKiB: 1130, maxPreloads: 192 },
]

const appRoot = join(import.meta.dir, '../..')
const publicDir = join(appRoot, '.output/public')
const serverBundle = readFileSync(join(appRoot, '.output/server/index.mjs'), 'utf8')

// TanStack Start inlines the route manifest as `tsrStartManifest = () => ({ routes: { … } })`.
const readRouteManifest = () => {
  const manifestStart = serverBundle.indexOf('tsrStartManifest = () => (')
  const manifestEnd = serverBundle.indexOf('} });', manifestStart)
  if (manifestStart !== -1 && manifestEnd !== -1) {
    const manifestSource = serverBundle.slice(
      manifestStart + 'tsrStartManifest = () => '.length,
      manifestEnd + '} })'.length,
    )
    try {
      // oxlint-disable-next-line typescript/no-implied-eval -- evaluates the object literal of our own build output
      const manifest = new Function(`return ${manifestSource}`)() as {
        routes?: Record<string, ManifestRoute>
      }
      if (manifest.routes) return manifest.routes
    } catch {}
  }
  throw new Error(
    'Could not read the route manifest (`tsrStartManifest`) from .output/server/index.mjs. Run `bun run build` first; if the build output format changed, update readRouteManifest in scripts/bundle-budget/index.ts.',
  )
}
const routes = readRouteManifest()

const parentOf = new Map<string, string>()
for (const [id, route] of Object.entries(routes)) {
  for (const child of route.children ?? []) parentOf.set(child, id)
}

const globalCss = readdirSync(join(publicDir, 'assets'))
  .filter((file) => file.startsWith('global-') && file.endsWith('.css'))
  .map((file) => `/assets/${file}`)

const gzipCache = new Map<string, number>()
const gzipBytes = (asset: string) => {
  let bytes = gzipCache.get(asset)
  if (bytes === undefined) {
    bytes = gzipSync(readFileSync(join(publicDir, asset))).length
    gzipCache.set(asset, bytes)
  }
  return bytes
}
const kib = (bytes: number) => Math.round(bytes / 1024)

const measure = (routeId: string) => {
  if (!routes[routeId]) throw new Error(`Route ${routeId} is not in the manifest`)
  const js = new Set<string>()
  const css = new Set<string>(globalCss)
  for (let id: string | undefined = routeId; id; id = parentOf.get(id)) {
    for (const asset of routes[id]?.preloads ?? []) js.add(asset)
    for (const asset of routes[id]?.css ?? []) css.add(asset)
  }
  const sum = (assets: Set<string>) => [...assets].reduce((total, a) => total + gzipBytes(a), 0)
  return { js, preloads: js.size, jsKiB: kib(sum(js)), cssKiB: kib(sum(css)) }
}

const printDetails = (js: Set<string>) => {
  console.log('    largest chunks (gzip):')
  for (const asset of [...js].sort((a, b) => gzipBytes(b) - gzipBytes(a)).slice(0, 6)) {
    console.log(
      `      ${String(kib(gzipBytes(asset))).padStart(5)} KiB ${asset.replace('/assets/', '')}`,
    )
  }
  const bytesByGroup = new Map<string, number>()
  for (const asset of js) addChunkSourceBytes(join(publicDir, asset), bytesByGroup)
  console.log('    largest sources (minified, before gzip):')
  for (const [group, bytes] of [...bytesByGroup].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`      ${String(kib(bytes)).padStart(5)} KiB ${group}`)
  }
}

const { values: args } = parseArgs({
  options: { report: { type: 'boolean' }, route: { type: 'string' } },
})

if (args.route) {
  const result = measure(args.route)
  console.log(
    `${args.route}: JS ${result.jsKiB} KiB gz · preloads ${result.preloads} · CSS ${result.cssKiB} KiB gz`,
  )
  printDetails(result.js)
  process.exit(0)
}

let failed = false
for (const budget of budgets) {
  const result = measure(budget.routeId)
  const over = result.jsKiB > budget.maxJsKiB || result.preloads > budget.maxPreloads
  failed ||= over
  console.log(
    `${over ? '✗' : '✓'} ${budget.routeId.padEnd(26)} JS ${String(result.jsKiB).padStart(5)} / ${budget.maxJsKiB} KiB gz · preloads ${String(result.preloads).padStart(3)} / ${budget.maxPreloads} · CSS ${result.cssKiB} KiB gz`,
  )
  if (args.report || over) printDetails(result.js)
}

if (failed) {
  console.error(
    '\nBundle budget exceeded. Find the import that pulled code into the route with `--report`, then lazy-load it or move it behind a server function.',
  )
  process.exit(1)
}
