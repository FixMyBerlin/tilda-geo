export type RunningDevStack = {
  /** `default` = develop stack (`db` / `tiles` on 5432 / 3000). */
  stackId: string
  databasePort: number
  tilesPort: number
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

async function composeWorkingDir(container: string) {
  const { out, exitCode } = await dockerText([
    'docker',
    'inspect',
    '--format',
    '{{index .Config.Labels "com.docker.compose.project.working_dir"}}',
    container,
  ])
  if (exitCode !== 0 || !out) return undefined
  return out
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
