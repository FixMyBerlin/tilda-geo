import { join } from 'node:path'

export type RunningDevStack = {
  /** `default` = develop stack (`db` / `tiles` on 5432 / 3000). */
  stackId: string
  databasePort: number
  tilesPort: number
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
    if (databasePort === undefined || tilesPort === undefined) continue

    stacks.push({
      stackId,
      databasePort,
      tilesPort,
      composeProject: await composeProject(name),
      repoRoot: await composeWorkingDir(name),
    })
  }

  return stacks.sort((a, b) => a.stackId.localeCompare(b.stackId))
}

export async function resolveRunningAttachStack(stackId: string) {
  const stacks = await listRunningDevStacks()
  const entry = stacks.find((s) => s.stackId === stackId)
  if (!entry) {
    throw new Error(
      `DEV_ATTACH_STACK=${stackId} not running — start that stack with bun run dev in its checkout first`,
    )
  }
  return entry
}

/** Stack id used for container names / compose -p (`default` → develop defaults). */
export function attachStackIdForDocker(stackId: string) {
  return stackId === DEVELOP_STACK_ID ? '' : stackId
}

/** Stop db+tiles for one discovered stack. */
export async function stopDevStack(stack: RunningDevStack) {
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
