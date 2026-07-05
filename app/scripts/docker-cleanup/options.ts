import { containerNamesForStoppedDevStacks, listDevStacks } from './devStackContext'
import {
  formatBytesAsGB,
  getStoppedContainerNames,
  getDanglingImageRefs,
  getDanglingImageSizeBytes,
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
  | 'stopped_dev_stacks'
  | 'full_system_prune'

type CleanupActionResult = { stdout: string; stderr: string; exitCode: number }

export type CleanupAction = {
  id: CleanupActionId
  label: string
  destructive: boolean
  description: string
  run: () => Promise<CleanupActionResult>
  previewTypes: string[] | 'total' | 'custom'
  getPreviewNames?: () => Promise<string[]>
  getCustomReclaimableBytes?: () => Promise<number>
}

export const DEFAULT_SELECTED_IDS = [
  'stopped_containers',
  'dangling_images',
  'build_cache_unused',
] satisfies CleanupActionId[]

const ACTION_ORDER: CleanupActionId[] = [
  'stopped_dev_stacks',
  'stopped_containers',
  'dangling_images',
  'build_cache_unused',
  'all_unused_images',
  'build_cache_all',
  'unused_volumes',
  'full_system_prune',
]

function getReclaimableBytes(summary: DfSummary, action: CleanupAction): number {
  if (!summary.ok) return 0
  if (action.previewTypes === 'total') return summary.totalReclaimableBytes
  if (action.previewTypes === 'custom') return 0
  const types = action.previewTypes
  return summary.rows
    .filter((r) => types.some((t) => r.type.toLowerCase().includes(t.toLowerCase())))
    .reduce((s, r) => s + r.reclaimableBytes, 0)
}

async function getActionReclaimableBytes(summary: DfSummary, action: CleanupAction) {
  if (action.getCustomReclaimableBytes) {
    return action.getCustomReclaimableBytes()
  }
  return getReclaimableBytes(summary, action)
}

export async function getPreviewGB(summary: DfSummary, action: CleanupAction) {
  if (!summary.ok) return summary.error
  const bytes = await getActionReclaimableBytes(summary, action)
  return formatBytesAsGB(bytes)
}

export function isDestructiveAction(id: CleanupActionId) {
  return id === 'unused_volumes' || id === 'full_system_prune'
}

export function formatMultiselectLabel(
  action: CleanupAction,
  summary: DfSummary,
  reclaimableLabel: string,
  preSelected: boolean,
) {
  const prefix = preSelected ? '✓ ' : '  '
  const destructiveSuffix = action.destructive ? ' – deletes data' : ''
  const sizePart = summary.ok ? ` – ${reclaimableLabel}` : ''
  const emoji = action.id === 'full_system_prune' ? '☢️ ' : action.destructive ? '⚠️ ' : prefix
  return `${emoji}${action.label}${sizePart}${destructiveSuffix}`
}

export const CLEANUP_ACTIONS: CleanupAction[] = [
  {
    id: 'stopped_containers',
    label: 'Stopped containers',
    destructive: false,
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
    destructive: false,
    description:
      'No data loss. Removes only untagged (dangling) image layers. For all unused images use "All unused images" below.',
    previewTypes: 'custom',
    getCustomReclaimableBytes: getDanglingImageSizeBytes,
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
    id: 'build_cache_unused',
    label: 'Build cache (unused)',
    destructive: false,
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
    id: 'stopped_dev_stacks',
    label: 'Stopped dev stacks (keep volumes)',
    destructive: false,
    description:
      'Removes stopped tilda-geo db+tiles container pairs only. Volumes are kept unless you also prune volumes.',
    previewTypes: 'custom',
    getPreviewNames: async () => {
      const stacks = await listDevStacks()
      return containerNamesForStoppedDevStacks(stacks)
    },
    run: async () => {
      const stacks = await listDevStacks()
      const names = containerNamesForStoppedDevStacks(stacks)
      if (names.length === 0) {
        return { stdout: 'No stopped dev stacks to remove.', stderr: '', exitCode: 0 }
      }
      const r = await dockerCmd(['rm', ...names], { timeoutMs: DOCKER_PRUNE_TIMEOUT_MS })
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
    destructive: false,
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
    destructive: false,
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
    id: 'unused_volumes',
    label: 'Unused volumes',
    destructive: true,
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
    id: 'full_system_prune',
    label: 'Full system prune (nuke)',
    destructive: true,
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

export function getActionsToRun(selectedIds: CleanupActionId[]) {
  if (selectedIds.includes('full_system_prune')) {
    const action = CLEANUP_ACTIONS.find((a) => a.id === 'full_system_prune')
    return action ? [action] : []
  }
  const selected = new Set(selectedIds)
  return ACTION_ORDER.filter((id) => selected.has(id)).map(
    (id) => CLEANUP_ACTIONS.find((a) => a.id === id)!,
  )
}

export function selectedRemovesContainers(selectedIds: CleanupActionId[]) {
  return selectedIds.some(
    (id) =>
      id === 'stopped_containers' || id === 'stopped_dev_stacks' || id === 'full_system_prune',
  )
}

export async function totalReclaimableGB(summary: DfSummary, actions: CleanupAction[]) {
  if (!summary.ok) return '0.00 GB'
  let bytes = 0
  for (const action of actions) {
    bytes += await getActionReclaimableBytes(summary, action)
  }
  return formatBytesAsGB(bytes)
}
