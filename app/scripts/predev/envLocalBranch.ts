import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { repoRootFromApp } from './ensureEnv'
import { logOk, logWarn } from './predevLog'

const DEFAULT_BRANCHES = ['develop', 'main']

const label = 'env_local_branch'

export function envLocalPath(repoRoot = repoRootFromApp()) {
  return join(repoRoot, '.env.local')
}

export async function currentGitBranch(repoRoot = repoRootFromApp()) {
  const proc = Bun.spawn(['git', 'branch', '--show-current'], {
    cwd: repoRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const branch = (await new Response(proc.stdout).text()).trim()
  await proc.exited
  return branch
}

export async function isLinkedWorktree(repoRoot = repoRootFromApp()) {
  const proc = Bun.spawn(['git', 'rev-parse', '--git-dir'], {
    cwd: repoRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const gitDir = (await new Response(proc.stdout).text()).trim()
  await proc.exited
  return gitDir.includes('/worktrees/')
}

function readBranchFromEnvLocal(localPath = envLocalPath()) {
  if (!existsSync(localPath)) return undefined
  const content = readFileSync(localPath, 'utf8')
  const match = content.match(/^# DEV_STACK_BRANCH=(.+)$/m)
  return match?.[1]?.trim()
}

function removeEnvLocal(repoRoot: string) {
  const localPath = envLocalPath(repoRoot)
  if (!existsSync(localPath)) return false
  unlinkSync(localPath)
  return true
}

async function restoreEnvExampleIfDirty(repoRoot: string) {
  const diff = Bun.spawn(['git', 'diff', '--quiet', '.env.example'], { cwd: repoRoot })
  await diff.exited
  if (diff.exitCode === 0) return false
  const restore = Bun.spawn(['git', 'restore', '--', '.env.example'], { cwd: repoRoot })
  await restore.exited
  return restore.exitCode === 0
}

export function isFeatureBranch(branch: string) {
  return Boolean(branch) && !DEFAULT_BRANCHES.includes(branch)
}

/** Isolated Docker stack + `.env.local` only in a linked worktree on a feature branch. */
export function usesIsolatedDevStack(branch: string, linkedWorktree: boolean) {
  return isFeatureBranch(branch) && linkedWorktree
}

export async function syncEnvLocalForBranch(repoRoot = repoRootFromApp()) {
  const branch = await currentGitBranch(repoRoot)
  const linkedWorktree = await isLinkedWorktree(repoRoot)
  const localPath = envLocalPath(repoRoot)

  if (!branch) {
    return { branch: '', action: 'none' as const }
  }

  if (!usesIsolatedDevStack(branch, linkedWorktree)) {
    const removed = removeEnvLocal(repoRoot)
    const restored = await restoreEnvExampleIfDirty(repoRoot)
    if (removed) {
      if (!isFeatureBranch(branch)) {
        return { branch, action: 'removed_on_default_branch' as const }
      }
      return { branch, action: 'removed_on_main_checkout' as const }
    }
    if (restored) {
      return { branch, action: 'env_example_restored' as const }
    }
    return { branch, action: 'none' as const }
  }

  if (!existsSync(localPath)) {
    return { branch, action: 'missing' as const }
  }

  const fileBranch = readBranchFromEnvLocal(localPath)
  if (fileBranch === branch) {
    return { branch, action: 'ok' as const }
  }

  removeEnvLocal(repoRoot)
  return { branch, action: 'stale_removed' as const }
}

export async function runEnvLocalBranchSync(options?: { quiet?: boolean }) {
  const result = await syncEnvLocalForBranch()
  if (options?.quiet) return result

  switch (result.action) {
    case 'removed_on_default_branch':
      logWarn(label, `Removed .env.local on ${DEFAULT_BRANCHES.join('/')}`)
      break
    case 'removed_on_main_checkout':
      logWarn(label, 'Removed .env.local — main checkout uses the default stack')
      break
    case 'stale_removed':
      logWarn(label, `Removed stale .env.local for branch ${result.branch}`)
      break
    case 'env_example_restored':
      logWarn(label, `Restored .env.example on ${DEFAULT_BRANCHES.join('/')}`)
      break
    case 'ok':
    case 'missing':
    case 'none':
      logOk(label)
      break
  }

  return result
}
