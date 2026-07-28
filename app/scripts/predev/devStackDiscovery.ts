import { join } from 'node:path'
import { DEV_DB_PORT, DEV_TILES_PORT } from './devStackPorts'

export type RunningDevStack = {
  /** `default` = develop stack (`db` / `tiles` on 5432 / 3000). */
  stackId: string
  composeProject?: string
  repoRoot?: string
}

const DEVELOP_STACK_ID = 'default'

async function dockerText(args: string[]) {
  const proc = Bun.spawn(args, { stdout: 'pipe', stderr: 'pipe' })
  const out = (await new Response(proc.stdout).text()).trim()
  await proc.exited
  return { out, exitCode: proc.exitCode ?? 1 }
}

async function publishedHostPort(container: string, containerPort: string) {
  const { out, exitCode } = await dockerText(['docker', 'port', container, containerPort])
  if (exitCode !== 0 || !out) return undefined
  const match = out.match(/:(\d+)/)
  return match ? Number(match[1]) : undefined
}

async function composeLabel(container: string, label: string) {
  const { out, exitCode } = await dockerText([
    'docker',
    'inspect',
    '--format',
    `{{index .Config.Labels "${label}"}}`,
    container,
  ])
  if (exitCode !== 0 || !out) return undefined
  return out
}

async function composeWorkingDir(container: string) {
  return composeLabel(container, 'com.docker.compose.project.working_dir')
}

async function composeProject(container: string) {
  return composeLabel(container, 'com.docker.compose.project')
}

async function isPostgisDbContainer(container: string) {
  const { out, exitCode } = await dockerText([
    'docker',
    'inspect',
    '--format',
    '{{.Config.Image}}',
    container,
  ])
  return exitCode === 0 && out.includes('postgis')
}

function stackIdFromDbContainer(name: string) {
  if (name === 'db') return DEVELOP_STACK_ID
  if (name.endsWith('_db')) return name.slice(0, -'_db'.length)
  return undefined
}

function dbContainerForStack(stackId: string) {
  return stackId === DEVELOP_STACK_ID ? 'db' : `${stackId}_db`
}

function tilesContainerForStack(stackId: string) {
  return stackId === DEVELOP_STACK_ID ? 'tiles' : `${stackId}_tiles`
}

/** Published host ports for a running stack, or undefined if db+tiles are not both up. */
export async function getRunningStackPublishedPorts(stackId: string) {
  const dbName = dbContainerForStack(stackId)
  const tilesName = tilesContainerForStack(stackId)

  const { out, exitCode } = await dockerText([
    'docker',
    'ps',
    '--filter',
    'status=running',
    '--format',
    '{{.Names}}',
  ])
  if (exitCode !== 0) return undefined

  const names = new Set(out.split('\n').filter(Boolean))
  if (!names.has(dbName) || !names.has(tilesName)) return undefined
  if (!(await isPostgisDbContainer(dbName))) return undefined

  const databasePort = await publishedHostPort(dbName, '5432')
  const tilesPort = await publishedHostPort(tilesName, '3000')
  if (databasePort === undefined || tilesPort === undefined) return undefined
  return { databasePort, tilesPort }
}

/** Running isolated (or develop) db+tiles pairs discovered from Docker. */
export async function listRunningDevStacks() {
  const { out, exitCode } = await dockerText([
    'docker',
    'ps',
    '--filter',
    'status=running',
    '--format',
    '{{.Names}}',
  ])
  if (exitCode !== 0) return []

  const names = new Set(out.split('\n').filter(Boolean))
  const stacks: RunningDevStack[] = []

  for (const name of names) {
    const stackId = stackIdFromDbContainer(name)
    if (!stackId) continue
    if (!(await isPostgisDbContainer(name))) continue

    const tilesName = tilesContainerForStack(stackId)
    if (!names.has(tilesName)) continue

    const databasePort = await publishedHostPort(name, '5432')
    const tilesPort = await publishedHostPort(tilesName, '3000')
    if (databasePort !== DEV_DB_PORT || tilesPort !== DEV_TILES_PORT) continue

    stacks.push({
      stackId,
      composeProject: await composeProject(name),
      repoRoot: await composeWorkingDir(name),
    })
  }

  return stacks.sort((a, b) => a.stackId.localeCompare(b.stackId))
}

export async function resolveRunningAttachStack(stackId: string) {
  // Use port-agnostic discovery so attach works for default and DEV_PORT_SLOT stacks.
  // listRunningDevStacks() only lists default ports (used by stop-others).
  const ports = await getRunningStackPublishedPorts(stackId)
  if (!ports) {
    throw new Error(
      `DEV_ATTACH_STACK=${stackId} not running — start that stack with bun run dev in its checkout first`,
    )
  }
  const dbName = dbContainerForStack(stackId)
  return {
    stackId,
    composeProject: await composeProject(dbName),
    repoRoot: await composeWorkingDir(dbName),
  } satisfies RunningDevStack
}

/** Stop db+tiles for one discovered stack. */
async function stopDevStack(stack: RunningDevStack) {
  if (stack.repoRoot && stack.composeProject) {
    const proc = Bun.spawn(
      [
        'docker',
        'compose',
        '-p',
        stack.composeProject,
        '-f',
        join(stack.repoRoot, 'docker-compose.yml'),
        '-f',
        join(stack.repoRoot, 'docker-compose.override.yml'),
        'stop',
        'db',
        'tiles',
      ],
      { cwd: stack.repoRoot, stdout: 'pipe', stderr: 'pipe' },
    )
    await proc.exited
    if (proc.exitCode === 0) return
  }

  const dbName = dbContainerForStack(stack.stackId)
  const tilesName = tilesContainerForStack(stack.stackId)
  await dockerText(['docker', 'stop', dbName, tilesName])
}

/** Stop tiles containers whose db sibling is not running (avoids restart loops on port 3000). */
export async function stopOrphanedTilesContainers() {
  const { out, exitCode } = await dockerText([
    'docker',
    'ps',
    '-a',
    '--format',
    '{{.Names}}\t{{.State}}',
  ])
  if (exitCode !== 0) return []

  const stopped: string[] = []

  for (const line of out.split('\n').filter(Boolean)) {
    const [name, state] = line.split('\t')
    if (!name || !state) continue
    if (state !== 'running' && state !== 'restarting') continue

    let stackId: string | undefined
    if (name === 'tiles') stackId = DEVELOP_STACK_ID
    else if (name.endsWith('_tiles')) stackId = name.slice(0, -'_tiles'.length)
    else continue

    const dbName = dbContainerForStack(stackId)
    const dbState = await dockerText(['docker', 'inspect', '--format', '{{.State.Status}}', dbName])
    if (dbState.exitCode === 0 && dbState.out === 'running') continue

    const stop = await dockerText(['docker', 'stop', name])
    if (stop.exitCode === 0) stopped.push(name)
  }

  return stopped
}

/** Stop every running dev stack except the one this checkout uses. */
export async function stopOtherRunningDevStacks(activeStackId: string) {
  const stacks = await listRunningDevStacks()
  const stopped: RunningDevStack[] = []

  for (const stack of stacks) {
    if (stack.stackId === activeStackId) continue
    await stopDevStack(stack)
    stopped.push(stack)
  }

  return stopped
}
