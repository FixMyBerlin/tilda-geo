#!/usr/bin/env bun
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { $ } from 'bun'

const DOC = 'docs/docker-local-development.md'
const SKIP_DIRS = new Set(['.git', 'node_modules'])
const HUSKY_HOOKS_PATH = 'app/.husky/_'

function usage() {
  console.log(`setup-worktree — create a git worktree for feature development

Usage (from app/):
  bun run setup-worktree -- my-branch [--dir my-worktree]

Use a short 1-3 word kebab-case branch name that describes the work.
By default, the worktree postfix matches the branch name.

Creates ../tilda-geo--my-branch with the branch, copies .env files, runs husky prepare.
Then: cd <printed-path>/app && bun run dev

See ${DOC}
`)
}

function sanitizePostfix(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function copyEnvFilesRecursive(srcRoot: string, destRoot: string, relDir = '') {
  const srcDir = join(srcRoot, relDir)
  if (!existsSync(srcDir)) return
  const entries = readdirSync(srcDir, { withFileTypes: true })
  for (const e of entries.filter(
    (d) =>
      d.isFile() && (d.name === '.env' || d.name.startsWith('.env.')) && d.name !== '.env.local',
  )) {
    const dest = join(destRoot, relDir, e.name)
    mkdirSync(join(dest, '..'), { recursive: true })
    copyFileSync(join(srcDir, e.name), dest)
    console.log(`Copied ${join(relDir, e.name) || e.name}`)
  }
  for (const e of entries) {
    if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue
    const subRel = join(relDir, e.name)
    if (existsSync(join(destRoot, subRel))) {
      copyEnvFilesRecursive(srcRoot, destRoot, subRel)
    }
  }
}

const args = process.argv.slice(2)
const dirIdx = args.indexOf('--dir')
let dirPostfix: string | undefined
const positional = args.filter((a, i) => {
  if (a === '--dir') return false
  if (dirIdx >= 0 && i === dirIdx + 1) {
    dirPostfix = a
    return false
  }
  return a !== '--'
})

const branch = positional[0]?.trim()
if (!branch || positional.length > 1 || args.includes('--help') || args.includes('-h')) {
  usage()
  process.exit(branch ? 1 : 0)
}

const repoRoot = (await $`git rev-parse --show-toplevel`.quiet()).text().trim()
if (!repoRoot) {
  console.error('Not inside a git repo.')
  process.exit(1)
}

const currentBranch = (await $`git branch --show-current`.quiet()).text().trim()
if (branch === currentBranch) {
  console.error(`Branch "${branch}" is already checked out in this worktree (${repoRoot}).`)
  console.error('Pick another branch, or run from a different worktree.')
  process.exit(1)
}

const postfix = sanitizePostfix(dirPostfix?.trim() || branch)
if (!postfix) {
  console.error('Could not derive folder name — pass --dir <postfix>')
  process.exit(1)
}

const targetDir = resolve(repoRoot, '..', `tilda-geo--${postfix}`)
if (existsSync(targetDir)) {
  console.error(`Target already exists: ${targetDir}`)
  process.exit(1)
}

console.log(`Creating worktree at ${targetDir} (branch ${branch})…`)
const addResult = await $`git worktree add ${targetDir} ${branch}`.quiet().nothrow()
if (addResult.exitCode !== 0) {
  const err = addResult.stderr.toString()
  if (err.includes('already used by') || err.includes('already checked out')) {
    console.error(`Branch "${branch}" is already in use by another worktree.`)
  } else {
    console.error(err || addResult.stdout.toString())
  }
  process.exit(1)
}

console.log('Copying .env files (not .env.local)…')
copyEnvFilesRecursive(repoRoot, targetDir)

const huskyDir = join(targetDir, 'app', '.husky')
if (existsSync(huskyDir)) {
  const configResult = await $`git config core.hooksPath ${HUSKY_HOOKS_PATH}`.cwd(targetDir).quiet()
  const chmodResult = await $`chmod -R +x app/.husky`.cwd(targetDir).quiet()
  if (configResult.exitCode !== 0) console.warn('Could not set core.hooksPath for worktree')
  if (chmodResult.exitCode !== 0) console.warn('Could not chmod app/.husky')
}

const prepareResult = await $`bun run prepare`.cwd(join(targetDir, 'app')).quiet().nothrow()
if (prepareResult.exitCode !== 0) {
  console.warn('bun run prepare failed — run it manually in the new worktree if hooks are needed')
}

const appDir = join(targetDir, 'app')
console.log('')
console.log('Worktree ready.')
console.log(`  cd ${appDir}`)
console.log('  bun run dev')
console.log('')
console.log(`Docs: ${DOC}`)
