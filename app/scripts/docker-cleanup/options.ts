import {
  formatBytesAsGB,
  getReclaimableForTypes,
  getStoppedContainerNames,
  getDanglingImageRefs,
  getUnusedVolumeNames,
  dockerCmd,
  DOCKER_PRUNE_TIMEOUT_MS,
} from './dockerPreview'
import type { DfSummary } from './dockerPreview'

export type CleanupActionId =
  | 'stopped_containers'
  | 'dangling_images'
  | 'unused_volumes'
  | 'build_cache_unused'
  | 'all_unused_images'
  | 'build_cache_all'
  | 'full_system_prune'

export type CleanupActionResult = { stdout: string; stderr: string; exitCode: number }

export type CleanupAction = {
  id: CleanupActionId
  label: string
  riskLabel: string
  description: string
  run: () => Promise<CleanupActionResult>
  previewTypes: string[] | 'total'
  getPreviewNames?: () => Promise<string[]>
  /** When true, reclaimable size is unknown (e.g. dangling images: df only reports total Images). */
  reclaimableUnknown?: true
}

function getReclaimableBytes(summary: DfSummary, action: CleanupAction): number {
  if (!summary.ok) return 0
  if (action.previewTypes === 'total') return summary.totalReclaimableBytes
  const types = action.previewTypes
  return summary.rows
    .filter((r) => types.some((t) => r.type.toLowerCase().includes(t.toLowerCase())))
    .reduce((s, r) => s + r.reclaimableBytes, 0)
}

export function getPreviewGB(summary: DfSummary, action: CleanupAction): string {
  if (!summary.ok) return summary.error
  return formatBytesAsGB(getReclaimableBytes(summary, action))
}

function previewFromSummary(summary: DfSummary, action: CleanupAction): string {
  if (!summary.ok) return summary.error
  if (action.previewTypes === 'total') {
    return summary.totalReclaimableHuman
  }
  return getReclaimableForTypes(summary, action.previewTypes)
}

export const CLEANUP_ACTIONS: CleanupAction[] = [
  {
    id: 'stopped_containers',
    label: 'Stopped containers',
    riskLabel: 'no data loss',
    description:
      "No data loss. Containers are recreated from images. Only risk: data that existed only inside a container's filesystem (not in a volume).",
    previewTypes: ['Containers'],
    getPreviewNames: getStoppedContainerNames,
    run: async () => {
      const r = await dockerCmd(['container', 'prune', '-f'], {
        timeoutMs: DOCKER_PRUNE_TIMEOUT_MS,
      })
      return {
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.timedOut ? -1 : r.exitCode,
      }
    },
  },
  {
    id: 'dangling_images',
    label: 'Unused (dangling) images',
    riskLabel: 'no data loss',
    reclaimableUnknown: true,
    description:
      'No data loss. Removes only untagged (dangling) image layers. For all unused images use "All unused images" below.',
    previewTypes: ['Images'],
    getPreviewNames: getDanglingImageRefs,
    run: async () => {
      const r = await dockerCmd(['image', 'prune', '-f'], { timeoutMs: DOCKER_PRUNE_TIMEOUT_MS })
      return {
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.timedOut ? -1 : r.exitCode,
      }
    },
  },
  {
    id: 'unused_volumes',
    label: 'Unused volumes',
    riskLabel: 'data loss',
    description:
      'Warning: can delete data. Removes volumes not used by any container (e.g. old DB volumes). Only choose if you are sure no important data is in those volumes.',
    previewTypes: ['Local Volumes'],
    getPreviewNames: getUnusedVolumeNames,
    run: async () => {
      const r = await dockerCmd(['volume', 'prune', '-f'], { timeoutMs: DOCKER_PRUNE_TIMEOUT_MS })
      return {
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.timedOut ? -1 : r.exitCode,
      }
    },
  },
  {
    id: 'build_cache_unused',
    label: 'Build cache (unused)',
    riskLabel: 'no data loss',
    description:
      'No data loss. Only removes cache not referenced by any image. Next build may be slower.',
    previewTypes: ['Build Cache'],
    run: async () => {
      const r = await dockerCmd(['builder', 'prune', '-f'], { timeoutMs: DOCKER_PRUNE_TIMEOUT_MS })
      return {
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.timedOut ? -1 : r.exitCode,
      }
    },
  },
  {
    id: 'all_unused_images',
    label: 'All unused images',
    riskLabel: 'no data loss',
    description:
      'No data loss. Removes every image not used by a running container (frees the "Images" reclaimable size).',
    previewTypes: ['Images'],
    run: async () => {
      const r = await dockerCmd(['image', 'prune', '-a', '-f'], {
        timeoutMs: DOCKER_PRUNE_TIMEOUT_MS,
      })
      return {
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.timedOut ? -1 : r.exitCode,
      }
    },
  },
  {
    id: 'build_cache_all',
    label: 'Build cache (all)',
    riskLabel: 'no data loss',
    description: 'No data loss. Clears all build cache; next build will be slower.',
    previewTypes: ['Build Cache'],
    run: async () => {
      const r = await dockerCmd(['builder', 'prune', '-a', '-f'], {
        timeoutMs: DOCKER_PRUNE_TIMEOUT_MS,
      })
      return {
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.timedOut ? -1 : r.exitCode,
      }
    },
  },
  {
    id: 'full_system_prune',
    label: 'Full system prune (nuke)',
    riskLabel: 'data loss',
    description:
      'Removes everything unused: containers, images, volumes, and all build cache. Can delete database and other data in unused volumes.',
    previewTypes: 'total',
    getPreviewNames: async () => {
      const [containers, volumes] = await Promise.all([
        getStoppedContainerNames(),
        getUnusedVolumeNames(),
      ])
      const lines: string[] = []
      if (containers.length) lines.push(`Containers: ${containers.join(', ')}`)
      if (volumes.length) lines.push(`Volumes: ${volumes.join(', ')}`)
      return lines
    },
    run: async () => {
      const r1 = await dockerCmd(['system', 'prune', '-f', '-a', '--volumes'], {
        timeoutMs: DOCKER_PRUNE_TIMEOUT_MS,
      })
      if (r1.timedOut || r1.exitCode !== 0) {
        return {
          stdout: r1.stdout,
          stderr: r1.stderr,
          exitCode: r1.timedOut ? -1 : r1.exitCode,
        }
      }
      const r2 = await dockerCmd(['builder', 'prune', '-a', '-f'], {
        timeoutMs: DOCKER_PRUNE_TIMEOUT_MS,
      })
      return {
        stdout: r1.stdout + r2.stdout,
        stderr: r2.stderr,
        exitCode: r2.timedOut ? -1 : r2.exitCode,
      }
    },
  },
]

export function getPreview(summary: DfSummary, action: CleanupAction): string {
  return previewFromSummary(summary, action)
}

export function getActionsToRun(selectedIds: CleanupActionId[]): CleanupAction[] {
  if (selectedIds.includes('full_system_prune')) {
    const action = CLEANUP_ACTIONS.find((a) => a.id === 'full_system_prune')
    return action ? [action] : []
  }
  return CLEANUP_ACTIONS.filter((a) => selectedIds.includes(a.id))
}
