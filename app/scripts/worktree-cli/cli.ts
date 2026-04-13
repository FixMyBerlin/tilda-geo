#!/usr/bin/env bun
import fs from 'node:fs'
import path from 'node:path'
import * as p from '@clack/prompts'
import { $ } from 'bun'

const REPO_ROOT = (await $`git rev-parse --show-toplevel`.quiet()).text().trim()
if (!REPO_ROOT) {
  console.error('Not inside a git repo.')
  process.exit(1)
}

p.intro('worktree-cli')

const postfix = await p.text({
  message: 'Folder name postfix (created as ../tilda-geo-<postfix>)',
  placeholder: 'develop',
  validate: (v) => {
    if (!v?.trim()) return 'Required'
    if (/[^\w.-]/.test(v)) return 'Use only letters, numbers, dash, dot, underscore'
    return undefined
  },
})
if (p.isCancel(postfix) || !postfix?.trim()) {
  p.cancel('Aborted.')
  process.exit(0)
}

const folderName = `tilda-geo-${postfix.trim()}`
const targetDir = path.resolve(REPO_ROOT, '..', folderName)

const refFormat = '%(refname:short)'
const branchList = (
  await $`git for-each-ref --sort=-committerdate refs/heads/ --format=${refFormat}`.quiet()
)
  .text()
  .trim()
  .split('\n')
  .filter(Boolean)
const lastFive = branchList.slice(0, 5)
const branchOptions = [
  ...lastFive.map((b) => ({ value: b, label: b })),
  { value: '__other__', label: 'Other (type branch name)' },
]

const branchChoice = await p.select({
  message: 'Branch to check out',
  options: branchOptions,
})
if (p.isCancel(branchChoice)) {
  p.cancel('Aborted.')
  process.exit(0)
}

let branch: string
if (branchChoice === '__other__') {
  const custom = await p.text({
    message: 'Branch name',
    placeholder: 'develop',
    validate: (v) => (!v?.trim() ? 'Required' : undefined),
  })
  if (p.isCancel(custom) || !custom?.trim()) {
    p.cancel('Aborted.')
    process.exit(0)
  }
  branch = custom.trim()
} else {
  branch = branchChoice as string
}

const currentBranch = (await $`git branch --show-current`.quiet()).text().trim()
if (branch === currentBranch) {
  p.log.error(`Branch "${branch}" is already checked out in this worktree (${REPO_ROOT}).`)
  p.log.message('Pick another branch, or run this script from a different worktree.')
  process.exit(1)
}

const spinner = p.spinner()
spinner.start('Creating worktree…')
const addResult = await $`git worktree add ${targetDir} ${branch}`.quiet()
spinner.stop(addResult.exitCode === 0 ? 'Worktree created.' : 'worktree add failed.')
if (addResult.exitCode !== 0) {
  const err = addResult.stderr.toString()
  if (err.includes('already used by') || err.includes('already checked out')) {
    p.log.error(`Branch "${branch}" is already in use by another worktree.`)
    p.log.message('Pick another branch.')
  } else {
    console.error(err)
  }
  process.exit(1)
}

const SKIP_DIRS = new Set(['.git', 'node_modules'])

function copyEnvFilesRecursive(srcRoot: string, destRoot: string, relDir = '') {
  const srcDir = path.join(srcRoot, relDir)
  const destDir = path.join(destRoot, relDir)
  if (!fs.existsSync(srcDir)) return
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })
  const envFiles = entries.filter(
    (d) => d.isFile() && (d.name === '.env' || d.name.startsWith('.env.')),
  )
  for (const e of envFiles) {
    const src = path.join(srcDir, e.name)
    const dest = path.join(destDir, e.name)
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
      p.log.step(`Copied ${path.relative(REPO_ROOT, src)} → worktree`)
    } catch {
      p.log.warn(`Could not copy ${path.relative(REPO_ROOT, src)}`)
    }
  }
  for (const e of entries) {
    if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue
    const subRel = path.join(relDir, e.name)
    if (fs.existsSync(path.join(destRoot, subRel))) {
      copyEnvFilesRecursive(srcRoot, destRoot, subRel)
    }
  }
}

spinner.start('Copying .env files…')
copyEnvFilesRecursive(REPO_ROOT, targetDir)
spinner.stop('Env files copied.')

// This repo: husky lives in app/.husky; app/package.json has "prepare": "cd .. && husky app/.husky"
const HUSKY_HOOKS_PATH = 'app/.husky/_'
const huskyDir = path.join(targetDir, 'app', '.husky')
if (fs.existsSync(huskyDir)) {
  spinner.start('Setting up Husky in worktree…')
  const configResult = await $`git config core.hooksPath ${HUSKY_HOOKS_PATH}`.cwd(targetDir).quiet()
  const chmodResult = await $`chmod -R +x app/.husky`.cwd(targetDir).quiet()
  if (configResult.exitCode === 0 && chmodResult.exitCode === 0) {
    p.log.step(`Set core.hooksPath to ${HUSKY_HOOKS_PATH}, made hooks executable`)
  } else {
    if (configResult.exitCode !== 0) p.log.warn('Could not set core.hooksPath for worktree')
    if (chmodResult.exitCode !== 0) p.log.warn('Could not chmod app/.husky')
  }
  spinner.stop('Husky setup done.')
}

const LAUNCH_APPS = [
  { value: 'cursor', label: 'Cursor', cmd: 'cursor' },
  { value: 'github', label: 'GitHub', cmd: 'github' },
] as const

const launchApps = await p.multiselect({
  message: 'Launch apps from folder',
  options: LAUNCH_APPS.map(({ value, label }) => ({ value, label })),
  initialValues: LAUNCH_APPS.map((o) => o.value),
  required: false,
})
if (p.isCancel(launchApps)) {
  p.cancel('Aborted.')
  process.exit(0)
}

const toLaunch = Array.isArray(launchApps) ? launchApps : []
const launchLabels = toLaunch.map((v) => LAUNCH_APPS.find((o) => o.value === v)?.label ?? v)
p.outro(toLaunch.length > 0 ? `Opening ${launchLabels.join(' and ')}…` : 'Done.')
const targetAbs = path.resolve(targetDir)
for (const v of toLaunch) {
  const app = LAUNCH_APPS.find((o) => o.value === v)
  if (app) await $`${app.cmd} ${targetAbs}`.quiet()
}
