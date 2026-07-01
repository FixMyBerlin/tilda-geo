const SIZE_UNITS: Record<string, number> = {
  B: 1,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
}

export const DOCKER_QUERY_TIMEOUT_MS = 15_000
export const DOCKER_PRUNE_TIMEOUT_MS = 120_000

export type DockerCmdResult = {
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
}

export async function dockerCmd(
  args: string[],
  options?: { timeoutMs?: number },
): Promise<DockerCmdResult> {
  const timeoutMs = options?.timeoutMs ?? DOCKER_QUERY_TIMEOUT_MS
  try {
    const proc = Bun.spawn({
      cmd: ['docker', ...args],
      stdout: 'pipe',
      stderr: 'pipe',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    const timedOut = exitCode === 143 || exitCode === 137
    return { stdout, stderr, exitCode, timedOut }
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')
    return {
      stdout: '',
      stderr: timedOut
        ? `Docker command timed out after ${timeoutMs / 1000}s (daemon may not be running).`
        : e instanceof Error
          ? e.message
          : String(e),
      exitCode: -1,
      timedOut: !!timedOut,
    }
  }
}

const RECLAIMABLE_REGEX = /(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)(?:\s*\(\d+%\))?/g

function parseSizeToBytes(str: string): number {
  const match = str.match(/(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)/i)
  if (!match || match[1] === undefined || match[2] === undefined) return 0
  const value = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()
  const multiplier = SIZE_UNITS[unit] ?? 1
  return value * multiplier
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let u = 0
  let v = bytes
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000
    u += 1
  }
  return `${v.toFixed(2)} ${units[u]}`
}

export function formatBytesAsGB(bytes: number): string {
  const gb = bytes / 1e9
  return `${gb.toFixed(2)} GB`
}

export type DfRow = {
  type: string
  reclaimableBytes: number
  reclaimableHuman: string
}

export type DfSummary =
  | {
      ok: true
      rows: DfRow[]
      totalReclaimableBytes: number
      totalReclaimableHuman: string
    }
  | {
      ok: false
      error: string
    }

function parseDfOutput(stdout: string): DfRow[] {
  const lines = stdout.trim().split('\n')
  if (lines.length < 2) return []
  const rows: DfRow[] = []
  const types = ['Images', 'Containers', 'Local Volumes', 'Build Cache']
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line === undefined) continue
    const matches = [...line.matchAll(RECLAIMABLE_REGEX)]
    const reclaimableMatch = matches[matches.length - 1]
    if (!reclaimableMatch || reclaimableMatch[1] === undefined || reclaimableMatch[2] === undefined)
      continue
    const reclaimableStr = `${reclaimableMatch[1]} ${reclaimableMatch[2]}`
    const reclaimableBytes = parseSizeToBytes(reclaimableStr)
    const type = types[rows.length] ?? line.split(/\s+/)[0] ?? 'Unknown'
    rows.push({
      type,
      reclaimableBytes,
      reclaimableHuman: formatBytes(reclaimableBytes),
    })
  }
  return rows
}

export async function getDockerDf(): Promise<DfSummary> {
  try {
    const result = await dockerCmd(['system', 'df'])
    if (result.timedOut) {
      return { ok: false, error: 'Docker daemon not responding (timed out). Is Docker running?' }
    }
    if (result.exitCode !== 0) {
      return { ok: false, error: 'Docker command failed or daemon not running.' }
    }
    const stdout = result.stdout
    const rows = parseDfOutput(stdout)
    const totalReclaimableBytes = rows.reduce((s, r) => s + r.reclaimableBytes, 0)
    return {
      ok: true,
      rows,
      totalReclaimableBytes,
      totalReclaimableHuman: formatBytes(totalReclaimableBytes),
    }
  } catch {
    return { ok: false, error: 'Docker not available (not installed or daemon not running).' }
  }
}

export function getReclaimableForTypes(summary: DfSummary, types: string[]): string {
  if (!summary.ok) return summary.error
  const bytes = summary.rows
    .filter((r) => types.some((t) => r.type.toLowerCase().includes(t.toLowerCase())))
    .reduce((s, r) => s + r.reclaimableBytes, 0)
  return formatBytes(bytes)
}

async function dockerFormat(args: string[]): Promise<string[]> {
  const result = await dockerCmd(args)
  if (result.timedOut || result.exitCode !== 0) return []
  const out = result.stdout.trim()
  return out ? out.split('\n').filter(Boolean) : []
}

export async function getStoppedContainerNames(): Promise<string[]> {
  return dockerFormat([
    'ps',
    '-a',
    '--filter',
    'status=exited',
    '--filter',
    'status=dead',
    '--format',
    '{{.Names}}',
  ])
}

export async function getDanglingImageRefs(): Promise<string[]> {
  return dockerFormat(['images', '-f', 'dangling=true', '--format', '{{.ID}}'])
}

export async function getUnusedVolumeNames(): Promise<string[]> {
  return dockerFormat(['volume', 'ls', '-f', 'dangling=true', '-q'])
}
