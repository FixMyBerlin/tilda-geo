import { $ } from 'bun'
import type { DfSummary } from './dockerPreview'
import {
  formatBytesAsGB,
  getReclaimableForTypes,
  getStoppedContainerNames,
  getDanglingImageRefs,
  getUnusedVolumeNames,
} from './dockerPreview'

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
      const r = await $`docker container prune -f`.quiet().nothrow()
      return {
        stdout: r.stdout.toString(),
        stderr: r.stderr.toString(),
        exitCode: r.exitCode ?? -1,
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
      const r = await $`docker image prune -f`.quiet().nothrow()
      return {
        stdout: r.stdout.toString(),
        stderr: r.stderr.toString(),
        exitCode: r.exitCode ?? -1,
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
      const r = await $`docker volume prune -f`.quiet().nothrow()
      return {
        stdout: r.stdout.toString(),
        stderr: r.stderr.toString(),
        exitCode: r.exitCode ?? -1,
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
      const r = await $`docker builder prune -f`.quiet().nothrow()
      return {
        stdout: r.stdout.toString(),
        stderr: r.stderr.toString(),
        exitCode: r.exitCode ?? -1,
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
      const r = await $`docker image prune -a -f`.quiet().nothrow()
      return {
        stdout: r.stdout.toString(),
        stderr: r.stderr.toString(),
        exitCode: r.exitCode ?? -1,
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
      const r = await $`docker builder prune -a -f`.quiet().nothrow()
      return {
        stdout: r.stdout.toString(),
        stderr: r.stderr.toString(),
        exitCode: r.exitCode ?? -1,
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
      const r1 = await $`docker system prune -f -a --volumes`.quiet().nothrow()
      if (r1.exitCode !== 0) {
        return {
          stdout: r1.stdout.toString(),
          stderr: r1.stderr.toString(),
          exitCode: r1.exitCode ?? -1,
        }
      }
      const r2 = await $`docker builder prune -a -f`.quiet().nothrow()
      return {
        stdout: r1.stdout.toString() + r2.stdout.toString(),
        stderr: r2.stderr.toString(),
        exitCode: r2.exitCode ?? -1,
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
