#!/usr/bin/env bun
import path from 'node:path'
import { parseArgs, styleText } from 'node:util'
import * as p from '@clack/prompts'
import { area, bboxPolygon } from '@turf/turf'
import { $ } from 'bun'
import dotenv from 'dotenv'
import { topicsConfig } from '../../../processing/constants/topics.const'
import {
  applyDevPortSlotToProcessEnv,
  exitOnInvalidDevPortSlot,
  isDevPortSlotMode,
} from '../predev/devPortSlot'
import { composeContainerPrefixFromEnv, dockerStackIdFromEnv } from '../predev/ensureDevStack'

const repoRootFromScript = path.resolve(import.meta.dir, '../../..')
dotenv.config({ path: path.join(repoRootFromScript, '.env') })
dotenv.config({ path: path.join(repoRootFromScript, '.env.local') })
exitOnInvalidDevPortSlot('processing')
applyDevPortSlotToProcessEnv()

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

const DIFFING_MODES = ['off', 'previous', 'fixed', 'reference'] as const
type DiffingMode = (typeof DIFFING_MODES)[number]

const PRESET_SLUGS_FOR_HELP = [...new Set(Object.keys(BBOX_PRESETS))].sort() as string[]

const CUSTOM_COORDS = '__custom__'
const VIEWER_BASE = 'https://viewer.tilda-geo.de'

type TopicsRunMode = 'all' | 'daily' | 'specific'

function allTopicIds() {
  return [...topicsConfig.keys()].sort((a, b) => a.localeCompare(b))
}

function topicMultiselectOptions() {
  return allTopicIds().map((id) => {
    const entry = topicsConfig.get(id)
    return {
      value: id,
      label: id,
      hint: entry?.schedule,
    }
  })
}

function resolveProcessOnlyTopics(mode: TopicsRunMode, selected: string[] = []) {
  if (mode === 'all') return allTopicIds().join(',')
  if (mode === 'daily') return ''
  if (selected.length === 0) {
    console.error('Select at least one topic for PROCESS_ONLY_TOPICS')
    process.exit(1)
  }
  return selected.join(',')
}

function topicsCliFlagsPresent() {
  let n = 0
  if (argPresent('--all-topics')) n++
  if (argPresent('--all-daily-topics')) n++
  if (argPresent('--topics')) n++
  return n
}

function parseBboxCsv(csv: string) {
  const parts = csv.split(',').map((s) => Number(s.trim()))
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return undefined
  return parts as [number, number, number, number]
}

function normalizeBboxCsv(csv: string) {
  const bbox = parseBboxCsv(csv)
  if (!bbox) return undefined
  return bbox.map((n) => n.toFixed(6)).join(',')
}

const DEFAULT_DIFF_BBOX = normalizeBboxCsv(BBOX_PRESETS['berlin-full'])!
const DEFAULT_ONLY_BBOX = normalizeBboxCsv(BBOX_PRESETS.bussonderstreifen)!

function bboxAreaSqm(csv: string) {
  const bbox = parseBboxCsv(csv)
  if (!bbox) return undefined
  return area(bboxPolygon(bbox))
}

function formatAreaSqm(sqm: number) {
  return `${Math.round(sqm).toLocaleString('en-US')} m²`
}

function viewerBboxUrl(coords: string) {
  const normalized = normalizeBboxCsv(coords) ?? coords
  return `${VIEWER_BASE}/?bbox=${normalized}`
}

function bboxHint(coords: string) {
  const sqm = bboxAreaSqm(coords)
  const areaPart = sqm !== undefined ? formatAreaSqm(sqm) : '?'
  return `${areaPart} · ${viewerBboxUrl(coords)}`
}

function formatBboxSummaryLine(envKey: string, coords: string) {
  const sqm = bboxAreaSqm(coords)
  const areaPart = sqm !== undefined ? formatAreaSqm(sqm) : '?'
  return `${envKey}: ${areaPart}\n${viewerBboxUrl(coords)}`
}

function buildBboxSummaryNote(onlyBbox: string, diffBbox: string, commandLine: string) {
  const lines = [formatBboxSummaryLine('PROCESS_ONLY_BBOX', onlyBbox)]
  if (diffBbox !== onlyBbox) {
    lines.push('', formatBboxSummaryLine('PROCESSING_DIFFING_BBOX', diffBbox))
  }
  lines.push('', commandLine)
  return lines.join('\n')
}

const ENV_ORDER_BEFORE_DIFF_MODE = [
  'PROCESSING_DIFFING_BBOX',
  'PROCESS_ONLY_BBOX',
  'PROCESS_ONLY_TOPICS',
  'SKIP_DOWNLOAD',
  'SKIP_UNCHANGED',
  'SKIP_WARM_CACHE',
  'WAIT_FOR_FRESH_DATA',
  'OSM2PGSQL_LOG_LEVEL',
  'PROCESS_GEOFABRIK_DOWNLOAD_URL',
] as const

const userArgs = Bun.argv.slice(2)

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    preset: { type: 'string' },
    'distinct-diff-bbox': { type: 'boolean' },
    'diff-bbox': { type: 'string' },
    'only-bbox': { type: 'string' },
    'diff-mode': { type: 'string' },
    topics: { type: 'string' },
    'all-topics': { type: 'boolean', default: false },
    'all-daily-topics': { type: 'boolean', default: false },
    'osm2pgsql-log-level': { type: 'string' },
    'skip-download': { type: 'string' },
    'skip-unchanged': { type: 'string' },
    'skip-warm-cache': { type: 'string' },
    'wait-fresh-data': { type: 'string' },
    'download-url': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    detach: { type: 'boolean', short: 'd', default: false },
    foreground: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
  allowPositionals: true,
})

function argPresent(long: string, short?: string) {
  const eq = `${long}=`
  for (const a of userArgs) {
    if (a === long || a.startsWith(eq)) return true
    if (short && a === short) return true
  }
  return false
}

function explicitRunKind(): 'dry' | 'detach' | 'foreground' | 'ambiguous' | 'none' {
  const dry = argPresent('--dry-run')
  const det = argPresent('--detach') || argPresent('-d')
  const fg = argPresent('--foreground')
  const n = (dry ? 1 : 0) + (det ? 1 : 0) + (fg ? 1 : 0)
  if (n === 0) return 'none'
  if (n > 1) return 'ambiguous'
  if (dry) return 'dry'
  if (det) return 'detach'
  return 'foreground'
}

function topicsChoiceSatisfied() {
  return topicsCliFlagsPresent() === 1
}

function resolveTopicsFromCli() {
  const flagCount = topicsCliFlagsPresent()
  if (flagCount > 1) {
    console.error('Use exactly one of --all-topics, --all-daily-topics, --topics')
    process.exit(1)
  }
  if (argPresent('--all-topics')) return resolveProcessOnlyTopics('all')
  if (argPresent('--all-daily-topics')) return resolveProcessOnlyTopics('daily')
  const csv = values.topics?.trim() ?? ''
  if (!csv) {
    console.error('--topics requires a non-empty CSV')
    process.exit(1)
  }
  return csv
}

function bboxChoiceSatisfied() {
  if (argPresent('--preset')) return true
  return argPresent('--only-bbox') && argPresent('--diff-bbox')
}

function isFullNonInteractiveBatch() {
  if (!bboxChoiceSatisfied()) return false
  if (!argPresent('--diff-mode')) return false
  if (!argPresent('--skip-download')) return false
  if (!argPresent('--skip-unchanged')) return false
  if (!argPresent('--skip-warm-cache')) return false
  const skipDl = values['skip-download']
  if (skipDl === '1' && !argPresent('--wait-fresh-data')) return false
  if (!topicsChoiceSatisfied()) return false
  const rk = explicitRunKind()
  return rk === 'dry' || rk === 'detach' || rk === 'foreground'
}

function printHelp() {
  console.log(`processing — print a copy-paste shell command for docker compose processing (see README)

Usage: bun run processing -- [options]

Interactive (TTY): prompts end with Show command (copy-paste) or Run command (execute in this terminal).
Non-interactive: prints one line only (for CI/agents). The line cds to the absolute repo root in a subshell, sets env vars, then runs docker compose.
Your shell cwd stays the same (safe to paste from app/). PROCESSING_DIFFING_MODE is last for easy edits.

Default: interactive prompts (Clack) when stdin is a TTY.

Non-interactive (CI, agents): pass **all** of the following (see example):
  • Bbox: --preset <slug>  OR  (--only-bbox <coords> AND --diff-bbox <coords>)
    Optional with --preset: --distinct-diff-bbox, --diff-bbox (override diff area)
  • --diff-mode <off|previous|fixed|reference>
  • Topics: exactly one of --all-topics (incl. weekly)  |  --all-daily-topics  |  --topics <csv>
  • --skip-download <0|1>  --skip-unchanged <0|1>  --skip-warm-cache <0|1>
  • If --skip-download 1: --wait-fresh-data <0|1>  (when --skip-download 0, flag optional)
  • Exactly one output mode: --dry-run  |  --detach (-d)  |  --foreground
    (--dry-run and --foreground both produce docker compose up processing; --detach uses up -d)

Optional (CLI only, never prompted): --osm2pgsql-log-level, --download-url (override Geofabrik extract URL; default comes from root .env)

Example (preset, all daily topics; bun run injects skip defaults):

  bun run processing -- \\
    --preset xhain \\
    --diff-mode fixed \\
    --all-daily-topics \\
    --skip-download 1 \\
    --skip-unchanged 0 \\
    --skip-warm-cache 1 \\
    --wait-fresh-data 0 \\
    --foreground

Bbox presets: ${PRESET_SLUGS_FOR_HELP.join(', ')}

  Interactive: default processing bbox = bussonderstreifen; diff bbox = berlin-full when that preset, else same as processing

-h, --help                This message
`)
}

function printBatchRequiredError() {
  console.error('processing: stdin is not a TTY. Pass a full non-interactive flag set.')
  console.error('Run from app/: bun run processing -- --help')
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
  return readBboxCsv(coords)
}

function readBboxCsv(csv: string) {
  const normalized = normalizeBboxCsv(csv)
  if (!normalized) {
    console.error(`Invalid bbox coordinates: ${csv}`)
    process.exit(1)
  }
  return normalized
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

function shellQuote(s: string) {
  if (!/[^\w@%+=:,./-]/i.test(s)) return s
  return `'${s.replace(/'/g, `'\\''`)}'`
}

function envAssignment(key: string, value: string) {
  const safe = redactKey(key) ? '[redacted]' : value
  return `${key}=${shellQuote(safe)}`
}

function formatShellOneLiner(repoRoot: string, overrides: Record<string, string>, detach: boolean) {
  const diffMode = overrides.PROCESSING_DIFFING_MODE
  if (diffMode === undefined) {
    console.error('Internal error: PROCESSING_DIFFING_MODE missing from overrides')
    process.exit(1)
  }

  const rest = { ...overrides }
  delete rest.PROCESSING_DIFFING_MODE

  const envParts: string[] = []
  for (const k of ENV_ORDER_BEFORE_DIFF_MODE) {
    if (Object.hasOwn(rest, k)) {
      const v = rest[k]
      if (v !== undefined) envParts.push(envAssignment(k, v))
      delete rest[k]
    }
  }
  for (const k of Object.keys(rest).sort()) {
    const v = rest[k]
    if (v !== undefined) envParts.push(envAssignment(k, v))
  }
  envParts.push(envAssignment('PROCESSING_DIFFING_MODE', diffMode))

  const containerPrefix = composeContainerPrefixFromEnv()
  if (containerPrefix) {
    envParts.unshift(envAssignment('COMPOSE_DEV_CONTAINER_PREFIX', containerPrefix))
  }

  if (isDevPortSlotMode()) {
    envParts.unshift(envAssignment('TILES_PORT', process.env.TILES_PORT ?? '3000'))
    envParts.unshift(envAssignment('DATABASE_PORT', process.env.DATABASE_PORT ?? '5432'))
  }

  const stackId = dockerStackIdFromEnv()
  const projectFlag = stackId ? `-p ${shellQuote(stackId)} ` : ''
  const compose = detach
    ? `docker compose ${projectFlag}up -d processing`
    : `docker compose ${projectFlag}up processing`

  const repoAbs = path.resolve(repoRoot)
  return `( cd ${shellQuote(repoAbs)} && ${envParts.join(' ')} ${compose} )`
}

function printHighlightedCommand(line: string) {
  const tty = process.stdout.isTTY
  const noColor = process.env.NO_COLOR !== undefined
  if (tty && !noColor) {
    try {
      console.log(styleText(['bold', 'green'], line))
      return
    } catch {
      /* util.styleText unsupported */
    }
  }
  console.log(line)
}

async function runShellOneLiner(line: string) {
  const proc = Bun.spawn(['sh', '-c', line], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: process.cwd(),
  })
  const code = await proc.exited
  process.exit(code === 0 ? 0 : (code ?? 1))
}

async function finishInteractive(
  repoRoot: string,
  overrides: Record<string, string>,
  detach: boolean,
) {
  const line = formatShellOneLiner(repoRoot, overrides, detach)
  const onlyBbox = overrides.PROCESS_ONLY_BBOX ?? ''
  const diffBbox = overrides.PROCESSING_DIFFING_BBOX ?? ''
  const noteBody = buildBboxSummaryNote(onlyBbox, diffBbox, line)
  const next = await p.select({
    message: 'What next?',
    options: [
      { value: 'show', label: 'Show command — copy and paste', hint: 'default' },
      { value: 'run', label: 'Run command — execute in this terminal', hint: 'live logs' },
    ],
    initialValue: 'show',
  })
  if (p.isCancel(next)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  if (next === 'show') {
    p.note(noteBody, 'copy paste this')
    p.outro('Done.')
    process.exit(0)
  }
  p.log.message(
    'Running in this terminal (your cwd can stay in app/; compose runs from repo root):',
  )
  p.log.message(line)
  await runShellOneLiner(line)
}

function presetOptionsForSelect() {
  return PRESET_SLUGS_FOR_HELP.map((slug) => {
    const coords = BBOX_PRESETS[slug as keyof typeof BBOX_PRESETS]
    return {
      value: slug,
      label: slug,
      hint: bboxHint(coords),
    }
  })
}

async function pickBboxCoords(message: string, defaultSlug: keyof typeof BBOX_PRESETS) {
  const choice = await p.select({
    message,
    options: [
      ...presetOptionsForSelect(),
      { value: CUSTOM_COORDS, label: 'Other — paste MINLON,MINLAT,MAXLON,MAXLAT' },
    ],
    initialValue: defaultSlug,
  })
  if (p.isCancel(choice)) return undefined
  if (choice === CUSTOM_COORDS) {
    const seedCoords = BBOX_PRESETS[defaultSlug]
    p.note(
      [
        'Preview/adjust bbox in the viewer:',
        viewerBboxUrl(seedCoords),
        '',
        'Change the bbox on the map, then copy the bbox string from the viewer',
        '(e.g. 12.5910,52.4017,14.0000,52.4915) and paste it below.',
      ].join('\n'),
      'Custom bbox',
    )
    const raw = await p.text({
      message: 'Coordinates (MINLON,MINLAT,MAXLON,MAXLAT)',
      placeholder: '12.5910,52.4017,14.0000,52.4915',
    })
    if (p.isCancel(raw)) return undefined
    const t = raw.trim()
    if (!t) {
      p.log.error('Coordinates cannot be empty.')
      return undefined
    }
    const normalized = normalizeBboxCsv(t)
    if (!normalized) {
      p.log.error('Invalid coordinates. Use MINLON,MINLAT,MAXLON,MAXLAT with four numbers.')
      return undefined
    }
    const sqm = bboxAreaSqm(normalized)
    if (sqm !== undefined) {
      p.log.message(`${formatAreaSqm(sqm)} · ${viewerBboxUrl(normalized)}`)
    }
    return normalized
  }
  return readBboxCsv(BBOX_PRESETS[choice as keyof typeof BBOX_PRESETS])
}

function logCliResolvedFlag(message: string, answerLabel: string, cliFlag: string) {
  p.log.step(
    `${message}\n│  ● ${answerLabel}\n│  Already set on the command line (\`${cliFlag}\`) — prompt skipped.`,
  )
}

function logCliResolvedBinary(
  message: string,
  long: string,
  value: '0' | '1',
  when1: string,
  when0: string,
) {
  logCliResolvedFlag(message, value === '1' ? when1 : when0, `${long} ${value}`)
}

async function selectBinaryFlag(message: string, initial: '0' | '1', when1: string, when0: string) {
  const v = await p.select({
    message,
    options: [
      { value: '1', label: when1, hint: '1' },
      { value: '0', label: when0, hint: '0' },
    ],
    initialValue: initial,
  })
  if (p.isCancel(v)) return undefined
  return v as '0' | '1'
}

async function binaryFromCliOrPrompt(
  long: '--skip-download' | '--skip-unchanged' | '--skip-warm-cache',
  valueKey: 'skip-download' | 'skip-unchanged' | 'skip-warm-cache',
  message: string,
  initial: '0' | '1',
  when1: string,
  when0: string,
) {
  if (argPresent(long)) {
    const v = parseBin(long, values[valueKey], initial)
    logCliResolvedBinary(message, long, v, when1, when0)
    return v
  }
  return selectBinaryFlag(message, initial, when1, when0)
}

function resolveWaitFreshData(skipDownload: '0' | '1') {
  const message = 'Wait for fresh Geofabrik data? (WAIT_FOR_FRESH_DATA)'
  const when1 = 'Yes — wait until extract is fresh'
  const when0 = 'No — not waiting'

  if (skipDownload === '0') {
    if (argPresent('--wait-fresh-data') && values['wait-fresh-data'] !== '0') {
      p.log.warn(
        '--wait-fresh-data ignored when --skip-download 0 (download runs; fresh-data wait is disabled).',
      )
    }
    return '0' as const
  }
  if (argPresent('--wait-fresh-data')) {
    const v = parseBin('--wait-fresh-data', values['wait-fresh-data'], '0')
    logCliResolvedBinary(message, '--wait-fresh-data', v, when1, when0)
    return v
  }
  return '0' as const
}

type RunPlan = { overrides: Record<string, string>; detach: boolean }

async function pickProcessOnlyTopics() {
  const mode = await p.select({
    message: 'Which topics to run? (PROCESS_ONLY_TOPICS)',
    options: [
      {
        value: 'all',
        label: 'All (incl. weekly)',
        hint: 'includes landcover (~weekly)',
      },
      {
        value: 'daily',
        label: 'All daily',
        hint: 'default nightly pipeline',
      },
      { value: 'specific', label: 'Only specific topics' },
    ],
    initialValue: 'all',
  })
  if (p.isCancel(mode)) return undefined

  if (mode === 'specific') {
    const selected = await p.multiselect({
      message: 'Which specific topics?',
      options: topicMultiselectOptions(),
      required: false,
    })
    if (p.isCancel(selected)) return undefined
    const ids = Array.isArray(selected) ? selected : []
    if (ids.length === 0) {
      p.log.error('Select at least one topic.')
      return undefined
    }
    return resolveProcessOnlyTopics('specific', ids)
  }

  return resolveProcessOnlyTopics(mode as TopicsRunMode)
}

async function collectInteractiveConfig(): Promise<RunPlan | undefined> {
  const onlyBbox = await pickBboxCoords('Processing bbox (PROCESS_ONLY_BBOX)', 'bussonderstreifen')
  if (onlyBbox === undefined) return undefined

  const diffBbox = onlyBbox === DEFAULT_ONLY_BBOX ? DEFAULT_DIFF_BBOX : onlyBbox

  const diffModeRaw = await p.select({
    message: 'Diffing mode (PROCESSING_DIFFING_MODE)',
    options: DIFFING_MODES.map((m) => ({
      value: m,
      label: m,
      hint: m === 'fixed' ? 'default' : undefined,
    })),
    initialValue: 'fixed',
  })
  if (p.isCancel(diffModeRaw)) return undefined

  const topicsRaw = await pickProcessOnlyTopics()
  if (topicsRaw === undefined) return undefined

  const skipDownload = await binaryFromCliOrPrompt(
    '--skip-download',
    'skip-download',
    'Skip Geofabrik download? (SKIP_DOWNLOAD)',
    '1',
    'Yes — skip download (default)',
    'No — run download',
  )
  if (skipDownload === undefined) return undefined

  const skipUnchanged = await binaryFromCliOrPrompt(
    '--skip-unchanged',
    'skip-unchanged',
    'Skip unchanged tables? (SKIP_UNCHANGED)',
    '0',
    'Yes — skip unchanged',
    'No — process all (default)',
  )
  if (skipUnchanged === undefined) return undefined

  const skipWarm = await binaryFromCliOrPrompt(
    '--skip-warm-cache',
    'skip-warm-cache',
    'Skip warm cache? (SKIP_WARM_CACHE)',
    '1',
    'Yes — skip warm cache (default)',
    'No — warm cache',
  )
  if (skipWarm === undefined) return undefined

  const waitFresh = resolveWaitFreshData(skipDownload)

  let downloadUrl: string | undefined
  if (argPresent('--download-url')) {
    const u = values['download-url']?.trim() ?? ''
    downloadUrl = u || undefined
    if (downloadUrl) {
      logCliResolvedFlag(
        'Geofabrik extract URL (PROCESS_GEOFABRIK_DOWNLOAD_URL)',
        downloadUrl,
        `--download-url ${downloadUrl}`,
      )
    }
  }

  const logLevel = values['osm2pgsql-log-level']?.trim()
  if (logLevel) {
    logCliResolvedFlag(
      'osm2pgsql log level (OSM2PGSQL_LOG_LEVEL)',
      logLevel,
      `--osm2pgsql-log-level ${logLevel}`,
    )
  }

  const action = await p.select({
    message: 'Compose command style',
    options: [
      {
        value: 'run',
        label: 'Foreground — docker compose up processing',
        hint: 'attached logs',
      },
      { value: 'detach', label: 'Detached — docker compose up -d processing', hint: 'background' },
    ],
    initialValue: 'detach',
  })
  if (p.isCancel(action)) return undefined

  const overrides: Record<string, string> = {
    PROCESSING_DIFFING_MODE: diffModeRaw as DiffingMode,
    PROCESSING_DIFFING_BBOX: diffBbox,
    PROCESS_ONLY_BBOX: onlyBbox,
    PROCESS_ONLY_TOPICS: topicsRaw,
    SKIP_DOWNLOAD: skipDownload,
    SKIP_UNCHANGED: skipUnchanged,
    SKIP_WARM_CACHE: skipWarm,
    WAIT_FOR_FRESH_DATA: waitFresh,
  }
  if (downloadUrl) overrides.PROCESS_GEOFABRIK_DOWNLOAD_URL = downloadUrl
  if (logLevel) overrides.OSM2PGSQL_LOG_LEVEL = logLevel

  return {
    overrides,
    detach: action === 'detach',
  }
}

function buildOverridesFromCliBatch() {
  const rk = explicitRunKind()
  if (rk === 'ambiguous') {
    console.error('Use exactly one of --dry-run, --detach (-d), --foreground')
    process.exit(1)
  }
  if (rk === 'none') {
    console.error(
      'Full non-interactive mode requires exactly one of --dry-run, --detach (-d), --foreground',
    )
    process.exit(1)
  }

  if (topicsCliFlagsPresent() > 1) {
    console.error('Use exactly one of --all-topics, --all-daily-topics, --topics')
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
    const ob = values['only-bbox']
    const db = values['diff-bbox']
    if (!ob || !db) {
      console.error(
        'Non-interactive batch requires --only-bbox and --diff-bbox when --preset is omitted.',
      )
      process.exit(1)
    }
    onlyBbox = ob
    diffBbox = db
  }
  if (values['only-bbox']) onlyBbox = values['only-bbox']
  if (values['diff-bbox']) diffBbox = values['diff-bbox']
  onlyBbox = readBboxCsv(onlyBbox)
  diffBbox = readBboxCsv(diffBbox)

  const topicsStr = resolveTopicsFromCli()

  const skipDl = parseBin('--skip-download', values['skip-download'], '1')
  const waitFresh =
    skipDl === '0' ? '0' : parseBin('--wait-fresh-data', values['wait-fresh-data'], '0')

  const overrides: Record<string, string> = {
    PROCESSING_DIFFING_MODE: parseDiffMode(values['diff-mode']),
    PROCESSING_DIFFING_BBOX: diffBbox,
    PROCESS_ONLY_BBOX: onlyBbox,
    PROCESS_ONLY_TOPICS: topicsStr,
    SKIP_DOWNLOAD: skipDl,
    SKIP_UNCHANGED: parseBin('--skip-unchanged', values['skip-unchanged'], '0'),
    SKIP_WARM_CACHE: parseBin('--skip-warm-cache', values['skip-warm-cache'], '1'),
    WAIT_FOR_FRESH_DATA: waitFresh,
  }

  if (values['osm2pgsql-log-level']) {
    overrides.OSM2PGSQL_LOG_LEVEL = values['osm2pgsql-log-level']
  }
  if (values['download-url']) {
    overrides.PROCESS_GEOFABRIK_DOWNLOAD_URL = values['download-url']
  }

  return {
    overrides,
    detach: rk === 'detach',
  }
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

const fullBatch = isFullNonInteractiveBatch()
if (!fullBatch && explicitRunKind() === 'ambiguous') {
  console.error('Use at most one of --dry-run, --detach (-d), --foreground')
  process.exit(1)
}

let overrides: Record<string, string>
let detach: boolean

if (!fullBatch) {
  if (!process.stdin.isTTY) {
    printBatchRequiredError()
    process.exit(1)
  }
  if (userArgs.length > 0) {
    console.warn(
      'processing: incomplete CLI flag set — opening interactive prompts. Skip/wait/download-url/osm2pgsql-log-level flags on the command line are applied; pass a full non-interactive set (see --help) to avoid prompts.',
    )
  }
  p.intro('processing')
  const plan = await collectInteractiveConfig()
  if (!plan) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  await finishInteractive(repoRoot, plan.overrides, plan.detach)
}

const batch = buildOverridesFromCliBatch()
overrides = batch.overrides
detach = batch.detach

printHighlightedCommand(formatShellOneLiner(repoRoot, overrides, detach))
process.exit(0)
