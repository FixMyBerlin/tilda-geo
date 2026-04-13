#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { getDockerDf } from './dockerPreview'
import { CLEANUP_ACTIONS, type CleanupActionId, getActionsToRun, getPreviewGB } from './options'

const CONCEPTS =
  'Images = templates (no app data); removing them frees disk, no data loss.\n' +
  'Containers = instances; removing stopped ones is usually safe (recreated from images).\n' +
  'Volumes = persistent data (e.g. DB); pruning them can delete data.\n' +
  'Build cache = build layers; pruning = no data loss, next build may be slower.'

p.intro('Docker cleanup')
p.note(CONCEPTS, 'Understand the terms')

const summary = await getDockerDf()
const optionsWithSizes = CLEANUP_ACTIONS.map((a) => {
  const reclaimableStr = a.reclaimableUnknown
    ? 'reclaimable: unknown'
    : summary.ok
      ? `${getPreviewGB(summary, a)} reclaimable`
      : null
  const label = summary.ok
    ? `${a.label} – ${a.riskLabel} – ${reclaimableStr}`
    : `${a.label} (Docker unavailable)`
  return { value: a.id, label }
})

const selected = await p.multiselect({
  message: 'What to remove? (order: least → most intrusive)',
  options: optionsWithSizes,
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
const actionsToShow = getActionsToRun(selectedIds)

const overviewLines = actionsToShow.map((a) => {
  const reclaimableStr = a.reclaimableUnknown
    ? 'reclaimable: unknown'
    : `${getPreviewGB(summary, a)} reclaimable`
  return `  ${a.label}: ${reclaimableStr}`
})
p.note(
  summary.ok
    ? `Reclaimable space (overview — what will save the most):\n${overviewLines.join('\n')}`
    : `Preview: ${summary.error}\nYou can still run the chosen commands.`,
  'Overview',
)

for (const action of actionsToShow) {
  const names = action.getPreviewNames ? await action.getPreviewNames() : []
  const namesBlurb = names.length > 0 ? `\n${names.map((n) => `  ${n}`).join('\n')}` : ' (no list)'
  p.note(`${action.label}:${namesBlurb}`, action.label)

  const runThis = await p.confirm({
    message: `Remove these ${action.label}?`,
    initialValue: true,
  })
  if (p.isCancel(runThis)) {
    p.cancel('Aborted.')
    process.exit(0)
  }
  if (!runThis) {
    p.log.step(`Skipped: ${action.label}`)
    continue
  }

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

p.outro('Cleanup complete.')
