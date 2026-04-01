import { $ } from 'bun'

const SIZE_UNITS: Record<string, number> = {
  B: 1,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
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
    const result = await $`docker system df`.quiet().nothrow()
    if (result.exitCode !== 0) {
      return { ok: false, error: 'Docker command failed or daemon not running.' }
    }
    const stdout = result.stdout.toString()
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
  try {
    const result = await $`docker ${args}`.quiet().nothrow()
    if (result.exitCode !== 0) return []
    const out = result.stdout.toString().trim()
    return out ? out.split('\n').filter(Boolean) : []
  } catch {
    return []
  }
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
  try {
    const result = await $`docker volume ls -f dangling=true -q`.quiet().nothrow()
    if (result.exitCode !== 0) return []
    const out = result.stdout.toString().trim()
    return out ? out.split('\n').filter(Boolean) : []
  } catch {
    return []
  }
}
