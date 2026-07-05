#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { parseDockerCleanupArgs, printDockerCleanupHelp } from './args'
import {
  classifyVolumes,
  formatStackLine,
  formatVolumeClassification,
  listDevStacks,
  listRunningDevStacks,
  listStoppedDevStacks,
} from './devStackContext'
import { formatDfStatus, getDockerDf, truncatePreviewNames } from './dockerPreview'
import {
  CLEANUP_ACTIONS,
  DEFAULT_SELECTED_IDS,
  type CleanupAction,
  type CleanupActionId,
  formatMultiselectLabel,
  getActionsToRun,
  getPreviewGB,
  isDestructiveAction,
  selectedRemovesContainers,
  totalReclaimableGB,
} from './options'

const CONCEPTS =
  'Images = templates (no app data). Containers = instances; stopped ones are usually safe.\n' +
  'Volumes = persistent data (e.g. DB); pruning can delete data.\n' +
  'Build cache = build layers; pruning is safe but next build may be slower.'

const PREVIEW_NAME_LIMIT = 15

async function getReclaimableLabel(
  summary: Awaited<ReturnType<typeof getDockerDf>>,
  action: CleanupAction,
) {
  if (action.id === 'stopped_dev_stacks') {
    const stacks = listStoppedDevStacks(await listDevStacks())
    return stacks.length === 1 ? '1 stack' : `${stacks.length} stacks`
  }
  return await getPreviewGB(summary, action)
}

function buildStatusNote(
  summary: Awaited<ReturnType<typeof getDockerDf>>,
  running: ReturnType<typeof listRunningDevStacks>,
  stopped: ReturnType<typeof listStoppedDevStacks>,
) {
  const lines: string[] = []
  if (summary.ok) {
    lines.push('Disk usage:')
    lines.push(formatDfStatus(summary))
  } else {
    lines.push(`Docker: ${summary.error}`)
  }
  lines.push('')
  if (running.length > 0) {
    lines.push('Protected (running dev stacks):')
    for (const stack of running) {
      lines.push(`  ${formatStackLine(stack)}`)
    }
    lines.push('  Safe cleanup will not touch these containers or their volumes.')
  } else {
    lines.push('No running dev stacks detected.')
  }
  if (stopped.length > 0) {
    lines.push('')
    lines.push('Stopped dev stacks (containers removable, volumes kept unless you prune volumes):')
    for (const stack of stopped) {
      lines.push(`  ${stack.stackId}`)
    }
  }
  return lines.join('\n')
}

async function buildConfirmBody(
  summary: Awaited<ReturnType<typeof getDockerDf>>,
  actions: CleanupAction[],
  selectedIds: CleanupActionId[],
) {
  const lines: string[] = []
  const total = await totalReclaimableGB(summary, actions)
  lines.push(`Estimated reclaimable: ${total}`)
  lines.push('')

  for (const action of actions) {
    const gb = await getReclaimableLabel(summary, action)
    lines.push(`${action.label} (${gb}):`)
    if (action.getPreviewNames) {
      const names = await action.getPreviewNames()
      const truncated = truncatePreviewNames(names, PREVIEW_NAME_LIMIT)
      if (truncated.length === 0) {
        lines.push('  (nothing to remove)')
      } else {
        for (const name of truncated) {
          lines.push(`  ${name}`)
        }
      }
    }
    lines.push('')
  }

  const hasDestructive = selectedIds.some(isDestructiveAction)
  if (hasDestructive) {
    lines.push('⚠️  Destructive actions selected — this can delete database and other volume data.')
  }

  if (
    selectedIds.includes('unused_volumes') &&
    selectedRemovesContainers(selectedIds) &&
    !selectedIds.includes('full_system_prune')
  ) {
    lines.push(
      '⚠️  Container cleanup runs before volume prune — stopped stack DB volumes may become prune-eligible.',
    )
  }

  return lines.join('\n').trimEnd()
}

async function confirmDestructive(selectedIds: CleanupActionId[]) {
  if (!selectedIds.some(isDestructiveAction)) return true

  if (selectedIds.includes('unused_volumes')) {
    const unusedVolumesAction = CLEANUP_ACTIONS.find((a) => a.id === 'unused_volumes')
    const volumeNames = unusedVolumesAction?.getPreviewNames
      ? await unusedVolumesAction.getPreviewNames()
      : []
    const classified = classifyVolumes(volumeNames)
    if (classified.length > 0) {
      const volumeLines = truncatePreviewNames(
        classified.map(formatVolumeClassification),
        PREVIEW_NAME_LIMIT,
      )
      p.note(volumeLines.map((line) => `  ${line}`).join('\n'), 'Volumes that may be deleted')
    }
  }

  const typed = await p.text({
    message: 'Type DELETE to confirm destructive cleanup',
    validate: (value) => (value === 'DELETE' ? undefined : 'Type DELETE exactly'),
  })
  if (p.isCancel(typed)) {
    p.cancel('Aborted.')
    return false
  }
  return true
}

async function runActions(actions: CleanupAction[]) {
  for (const action of actions) {
    const spinner = p.spinner()
    spinner.start(`Running: ${action.label}…`)
    try {
      const result = await action.run()
      spinner.stop(`Done: ${action.label}`)
      if (result.exitCode !== 0) {
        p.log.error(result.stderr.trim() || `Exit code ${result.exitCode}`)
        process.exit(1)
      }
      const out = result.stdout.trim()
      if (out) p.log.message(out)
    } catch (e) {
      spinner.stop(`Failed: ${action.label}`)
      p.log.error(e instanceof Error ? e.message : String(e))
      process.exit(1)
    }
  }
}

async function runCleanup(selectedIds: CleanupActionId[], options: { dryRun: boolean }) {
  const actions = getActionsToRun(selectedIds)
  if (actions.length === 0) return

  if (options.dryRun) {
    const summary = await getDockerDf()
    const body = await buildConfirmBody(summary, actions, selectedIds)
    p.log.message(body)
    return
  }

  const before = await getDockerDf()
  await runActions(actions)
  const after = await getDockerDf()

  if (before.ok && after.ok) {
    const reclaimed = before.totalReclaimableBytes - after.totalReclaimableBytes
    if (reclaimed > 0) {
      p.log.success(
        `Reclaimed ~${(reclaimed / 1e9).toFixed(2)} GB (${before.totalReclaimableHuman} → ${after.totalReclaimableHuman} total reclaimable)`,
      )
    }
  }
}

async function main() {
  const args = parseDockerCleanupArgs(Bun.argv)
  if (args.help) {
    printDockerCleanupHelp()
    return
  }

  const nonInteractive = args.quick || args.dryRun
  if (!process.stdin.isTTY && !nonInteractive) {
    printDockerCleanupHelp()
    throw new Error('Non-interactive mode requires --quick or --dry-run.')
  }

  if (args.quick || args.dryRun) {
    if (args.quick) p.intro('Docker cleanup (--quick)')
    else p.intro('Docker cleanup (--dry-run)')

    const selectedIds = [...DEFAULT_SELECTED_IDS]
    if (args.dryRun) {
      await runCleanup(selectedIds, { dryRun: true })
      p.outro('Dry run complete — no changes made.')
      return
    }

    await runCleanup(selectedIds, { dryRun: false })
    p.outro('Cleanup complete.')
    return
  }

  p.intro('Docker cleanup')

  const dfSpinner = p.spinner()
  dfSpinner.start('Checking Docker…')
  const [summary, devStacks] = await Promise.all([getDockerDf(), listDevStacks()])
  dfSpinner.stop(summary.ok ? 'Docker is available' : summary.error)

  const running = listRunningDevStacks(devStacks)
  const stopped = listStoppedDevStacks(devStacks)
  p.note(buildStatusNote(summary, running, stopped), 'Status')
  p.note(CONCEPTS, 'Quick reference')

  const defaultSet = new Set<string>(DEFAULT_SELECTED_IDS)
  const multiselectOptions = await Promise.all(
    CLEANUP_ACTIONS.map(async (action) => {
      const reclaimableLabel = await getReclaimableLabel(summary, action)
      return {
        value: action.id,
        label: formatMultiselectLabel(action, summary, reclaimableLabel, defaultSet.has(action.id)),
      }
    }),
  )

  const selected = await p.multiselect({
    message: 'What to remove? (least → most intrusive; ✓ = pre-selected)',
    options: multiselectOptions,
    initialValues: [...DEFAULT_SELECTED_IDS],
    required: false,
  })

  if (p.isCancel(selected)) {
    p.cancel('Aborted.')
    process.exit(0)
  }

  const selectedIds = (Array.isArray(selected) ? selected : []) as CleanupActionId[]
  if (selectedIds.length === 0) {
    p.cancel('Nothing selected.')
    process.exit(0)
  }

  if (selectedIds.includes('full_system_prune') && selectedIds.length > 1) {
    p.note('Full system prune supersedes other selections.', 'Note')
  }

  const actions = getActionsToRun(selectedIds)
  const confirmBody = await buildConfirmBody(summary, actions, selectedIds)

  p.note(confirmBody, 'Plan')

  const proceed = await p.confirm({
    message: 'Run selected cleanup?',
    initialValue: true,
  })
  if (p.isCancel(proceed) || !proceed) {
    p.cancel('Aborted.')
    process.exit(0)
  }

  const destructiveOk = await confirmDestructive(selectedIds)
  if (!destructiveOk) {
    process.exit(0)
  }

  await runCleanup(selectedIds, { dryRun: false })
  p.outro('Cleanup complete.')
}

main().catch((e) => {
  p.log.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
