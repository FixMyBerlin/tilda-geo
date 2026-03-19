#!/usr/bin/env bun
import { parseArgs } from 'node:util'
import { $ } from 'bun'

const BBOX_PRESETS = {
  bussonderstreifen: '13.38486,52.43778,13.38956,52.43959',
  'berlin-full': '13.0883,52.3382,13.7611,52.6755',
  berlin: '13.0883,52.3382,13.7611,52.6755',
  'obstacle-parking-yes':
    '13.405287099192833,52.50837530588882,13.410218310776344,52.51078864624628',
  'circle-kreisverkehr':
    '13.304848152351326,52.44115376821972,13.317513299482641,52.446557694962536',
  xhain: '13.380,52.488,13.418,52.503',
  'berlin-parking': '13.41904861,52.467335,13.4616607,52.487559',
  'lane-centre': '13.427407,52.51004,13.46981,52.528016',
  'berlin-parking-bus-stop': '13.295719,52.49283,13.33790,52.514279',
} as const satisfies Record<string, string>

const DEFAULT_DIFF_BBOX = BBOX_PRESETS['berlin-full']
const DEFAULT_ONLY_BBOX = BBOX_PRESETS['bussonderstreifen']

const DIFFING_MODES = ['off', 'previous', 'fixed', 'reference'] as const
type DiffingMode = (typeof DIFFING_MODES)[number]

const PRESET_SLUGS_FOR_HELP = [...new Set(Object.keys(BBOX_PRESETS))].sort() as string[]

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    preset: { type: 'string' },
    'distinct-diff-bbox': { type: 'boolean' },
    'diff-bbox': { type: 'string' },
    'only-bbox': { type: 'string' },
    'diff-mode': { type: 'string' },
    topics: { type: 'string' },
    'id-filter': { type: 'string' },
    'osm2pgsql-log-level': { type: 'string' },
    'skip-download': { type: 'string' },
    'skip-unchanged': { type: 'string' },
    'skip-warm-cache': { type: 'string' },
    'wait-fresh-data': { type: 'string' },
    'download-url': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    detach: { type: 'boolean', short: 'd', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
  allowPositionals: true,
})

function printHelp() {
  console.log(`test:processing-diff — run docker compose processing with env overrides (see README)

Usage: bun run test:processing-diff -- [options]

Bbox:
  --preset <slug>           Set PROCESS_ONLY_BBOX (+ PROCESSING_DIFFING_BBOX unless --distinct-diff-bbox)
  --distinct-diff-bbox      With --preset: only-bbox = preset coords; diff-bbox = default Berlin full or --diff-bbox
  --only-bbox <coords>      Override PROCESS_ONLY_BBOX (MINLON,MINLAT,MAXLON,MAXLAT)
  --diff-bbox <coords>      Override PROCESSING_DIFFING_BBOX

  Presets: ${PRESET_SLUGS_FOR_HELP.join(', ')}

Defaults (no --preset): only-bbox = bussonderstreifen, diff-bbox = berlin-full

Diff / processing:
  --diff-mode <mode>        off | previous | fixed | reference (default: fixed)
  --topics <list>           PROCESS_ONLY_TOPICS (comma-separated, empty = all)
  --id-filter <string>      ID_FILTER (e.g. "w123 w456")
  --osm2pgsql-log-level <lvl>  OSM2PGSQL_LOG_LEVEL
  --download-url <url>      PROCESS_GEOFABRIK_DOWNLOAD_URL (optional; else .env)

  --skip-download <0|1>   (default: 1)
  --skip-unchanged <0|1>  (default: 0)
  --skip-warm-cache <0|1> (default: 0)
  --wait-fresh-data <0|1> (default: 0)

Run:
  --dry-run                 Print overrides + docker command, do not run
  -d, --detach              docker compose up -d
  -h, --help                This message
`)
}

function parseBin(name: string, raw: string | undefined, defaultVal: '0' | '1') {
  if (raw === undefined) return defaultVal
  if (raw !== '0' && raw !== '1') {
    console.error(`${name} must be 0 or 1, got: ${raw}`)
    process.exit(1)
  }
  return raw
}

function resolvePreset(slug: string) {
  const coords = BBOX_PRESETS[slug as keyof typeof BBOX_PRESETS]
  if (!coords) {
    console.error(`Unknown --preset "${slug}". Use one of: ${PRESET_SLUGS_FOR_HELP.join(', ')}`)
    process.exit(1)
  }
  return coords
}

function parseDiffMode(raw: string | undefined): DiffingMode {
  const v = raw ?? 'fixed'
  if (!DIFFING_MODES.includes(v as DiffingMode)) {
    console.error(`--diff-mode must be one of: ${DIFFING_MODES.join(', ')}, got: ${v}`)
    process.exit(1)
  }
  return v as DiffingMode
}

function redactKey(key: string) {
  return /PASSWORD|SECRET|TOKEN|KEY/i.test(key)
}

function printDryRun(overrides: Record<string, string>, detach: boolean) {
  const parts: string[] = []
  for (const [k, v] of Object.entries(overrides)) {
    const safe = redactKey(k) ? '[redacted]' : v
    parts.push(`${k}=${shellQuote(safe)}`)
  }
  console.log(parts.join(' \\\n  '))
  const tail = detach ? 'docker compose up -d processing' : 'docker compose up processing'
  console.log('\n' + tail)
}

function shellQuote(s: string) {
  if (!/[^\w@%+=:,./-]/i.test(s)) return s
  return `'${s.replace(/'/g, `'\\''`)}'`
}

if (values.help) {
  printHelp()
  process.exit(0)
}

const repoRoot = (await $`git rev-parse --show-toplevel`.quiet()).text().trim()
if (!repoRoot) {
  console.error('Not inside a git repo.')
  process.exit(1)
}

let onlyBbox: string
let diffBbox: string
if (values.preset) {
  const c = resolvePreset(values.preset)
  if (values['distinct-diff-bbox']) {
    onlyBbox = c
    diffBbox = DEFAULT_DIFF_BBOX
  } else {
    onlyBbox = c
    diffBbox = c
  }
} else {
  onlyBbox = DEFAULT_ONLY_BBOX
  diffBbox = DEFAULT_DIFF_BBOX
}
if (values['only-bbox']) onlyBbox = values['only-bbox']
if (values['diff-bbox']) diffBbox = values['diff-bbox']

const overrides: Record<string, string> = {
  PROCESSING_DIFFING_MODE: parseDiffMode(values['diff-mode']),
  PROCESSING_DIFFING_BBOX: diffBbox,
  PROCESS_ONLY_BBOX: onlyBbox,
  PROCESS_ONLY_TOPICS: values.topics ?? '',
  ID_FILTER: values['id-filter'] ?? '',
  SKIP_DOWNLOAD: parseBin('--skip-download', values['skip-download'], '1'),
  SKIP_UNCHANGED: parseBin('--skip-unchanged', values['skip-unchanged'], '0'),
  SKIP_WARM_CACHE: parseBin('--skip-warm-cache', values['skip-warm-cache'], '0'),
  WAIT_FOR_FRESH_DATA: parseBin('--wait-fresh-data', values['wait-fresh-data'], '0'),
}

if (values['osm2pgsql-log-level']) {
  overrides.OSM2PGSQL_LOG_LEVEL = values['osm2pgsql-log-level']
}
if (values['download-url']) {
  overrides.PROCESS_GEOFABRIK_DOWNLOAD_URL = values['download-url']
}

if (values['dry-run']) {
  printDryRun(overrides, values.detach)
  process.exit(0)
}

process.chdir(repoRoot)

const dbPreflight = await $`docker compose up -d db`.quiet()
if (dbPreflight.exitCode === 0) {
  console.log('FYI: db preflight check succeeded (`docker compose up -d db`).')
} else {
  console.warn('FYI: db preflight check failed (`docker compose up -d db`). Continuing anyway.')
  const err = dbPreflight.stderr.toString().trim()
  if (err) console.warn(err)
}

const previousEnv: Record<string, string | undefined> = {}
for (const [key, value] of Object.entries(overrides)) {
  previousEnv[key] = process.env[key]
  process.env[key] = value
}

try {
  const composeResult = values.detach
    ? await $`docker compose up -d processing`
    : await $`docker compose up processing`
  if (values.detach && composeResult.exitCode === 0) {
    console.warn('\nDetached. Follow logs: docker logs -f processing\n')
  }
  process.exit(composeResult.exitCode === 0 ? 0 : composeResult.exitCode || 1)
} finally {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}
