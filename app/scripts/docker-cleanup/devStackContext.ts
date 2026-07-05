import { dockerCmd } from './dockerPreview'

const DEVELOP_STACK_ID = 'default'

export type DevStackInfo = {
  stackId: string
  databasePort?: number
  tilesPort?: number
  dbContainer: string
  tilesContainer: string
  state: 'running' | 'stopped'
}

type VolumeKind = 'dev-db' | 'dev-osm' | 'unknown'

export type ClassifiedVolume = {
  name: string
  kind: VolumeKind
}

type ContainerRow = {
  name: string
  running: boolean
}

async function dockerLines(args: string[]) {
  const result = await dockerCmd(args)
  if (result.timedOut || result.exitCode !== 0) return []
  const out = result.stdout.trim()
  return out ? out.split('\n').filter(Boolean) : []
}

async function publishedHostPort(container: string, containerPort: string) {
  const result = await dockerCmd(['port', container, containerPort])
  if (result.timedOut || result.exitCode !== 0 || !result.stdout.trim()) return undefined
  const match = result.stdout.match(/:(\d+)/)
  return match ? Number(match[1]) : undefined
}

async function isPostgisDbContainer(name: string) {
  const result = await dockerCmd(['inspect', '--format', '{{.Config.Image}}', name])
  return result.exitCode === 0 && result.stdout.includes('postgis')
}

function stackIdFromDbContainer(name: string) {
  if (name === 'db') return DEVELOP_STACK_ID
  if (name.endsWith('_db')) return name.slice(0, -'_db'.length)
  return undefined
}

function tilesContainerForStack(stackId: string) {
  return stackId === DEVELOP_STACK_ID ? 'tiles' : `${stackId}_tiles`
}

async function listContainerRows() {
  const lines = await dockerLines(['ps', '-a', '--format', '{{.Names}}\t{{.State}}'])
  const rows: ContainerRow[] = []
  for (const line of lines) {
    const [name, state] = line.split('\t')
    if (!name || !state) continue
    rows.push({ name, running: state === 'running' || state === 'restarting' })
  }
  return rows
}

async function devStackFromDbContainer(
  name: string,
  rowsByName: Map<string, ContainerRow>,
  names: Set<string>,
) {
  const stackId = stackIdFromDbContainer(name)
  if (!stackId) return undefined
  if (!(await isPostgisDbContainer(name))) return undefined

  const tilesName = tilesContainerForStack(stackId)
  if (!names.has(tilesName)) return undefined

  const dbRow = rowsByName.get(name)
  const tilesRow = rowsByName.get(tilesName)
  if (!dbRow || !tilesRow) return undefined

  const dbRunning = dbRow.running
  const tilesRunning = tilesRow.running
  if (dbRunning !== tilesRunning) return undefined

  const running = dbRunning
  const databasePort = running ? await publishedHostPort(name, '5432') : undefined
  const tilesPort = running ? await publishedHostPort(tilesName, '3000') : undefined

  return {
    stackId,
    databasePort,
    tilesPort,
    dbContainer: name,
    tilesContainer: tilesName,
    state: running ? ('running' as const) : ('stopped' as const),
  } satisfies DevStackInfo
}

/** Running and stopped tilda-geo db+tiles pairs (any host ports). */
export async function listDevStacks() {
  const rows = await listContainerRows()
  const rowsByName = new Map(rows.map((r) => [r.name, r]))
  const names = new Set(rows.map((r) => r.name))
  const byStackId = new Map<string, DevStackInfo>()

  for (const row of rows) {
    const stack = await devStackFromDbContainer(row.name, rowsByName, names)
    if (!stack) continue
    const existing = byStackId.get(stack.stackId)
    if (!existing || stack.state === 'running') {
      byStackId.set(stack.stackId, stack)
    }
  }

  return [...byStackId.values()].sort((a, b) => a.stackId.localeCompare(b.stackId))
}

export function listRunningDevStacks(stacks: DevStackInfo[]) {
  return stacks.filter((s) => s.state === 'running')
}

export function listStoppedDevStacks(stacks: DevStackInfo[]) {
  return stacks.filter((s) => s.state === 'stopped')
}

export function formatStackLine(stack: DevStackInfo) {
  if (stack.databasePort !== undefined && stack.tilesPort !== undefined) {
    return `${stack.stackId} (${stack.databasePort}/${stack.tilesPort})`
  }
  return stack.stackId
}

function classifyVolumeName(name: string): VolumeKind {
  if (name.endsWith('_db_postgres_17') || name === 'db_postgres_17') return 'dev-db'
  if (name.endsWith('_osmfiles') || name === 'osmfiles') return 'dev-osm'
  return 'unknown'
}

export function classifyVolumes(names: string[]): ClassifiedVolume[] {
  return names.map((name) => ({ name, kind: classifyVolumeName(name) }))
}

export function formatVolumeClassification(volume: ClassifiedVolume) {
  const tag =
    volume.kind === 'dev-db' ? 'Postgres data' : volume.kind === 'dev-osm' ? 'OSM files' : 'unknown'
  return `${volume.name} (${tag})`
}

export function containerNamesForStoppedDevStacks(stacks: DevStackInfo[]) {
  return listStoppedDevStacks(stacks).flatMap((s) => [s.dbContainer, s.tilesContainer])
}
