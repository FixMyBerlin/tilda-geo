import { copyFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { confirm, isCancel, note } from '@clack/prompts'
import { argv } from '@/scripts/lib/bun'
import { logErr, logOk, logWarn } from './predevLog'

const label = 'ensure_env'

const PRIMARY_ENV_SOURCE = '../tilda-geo/.env'

export function repoRootFromApp() {
  return join(process.cwd(), '..')
}

export function envPath(repoRoot = repoRootFromApp()) {
  return join(repoRoot, '.env')
}

export function primaryEnvSourcePath(repoRoot = repoRootFromApp()) {
  return resolve(repoRoot, PRIMARY_ENV_SOURCE)
}

async function copyEnvFromPrimary(sourcePath: string, destPath: string) {
  copyFileSync(sourcePath, destPath)
  logOk(`${label} (copied ${sourcePath} → ${destPath})`)
}

export async function ensureEnv() {
  const repoRoot = repoRootFromApp()
  const dest = envPath(repoRoot)

  if (existsSync(dest)) {
    logOk(label)
    return
  }

  const source = primaryEnvSourcePath(repoRoot)
  const sourceExists = existsSync(source)

  logWarn(label, `No .env in this worktree (${dest})`)

  if (!sourceExists) {
    note('Create .env from .env.example or see docs/docker-local-development.md', 'Missing .env')
    logErr(label, `Primary env not found at ${source}`)
    process.exit(1)
  }

  const isInteractive = process.stdin.isTTY && !argv.includes('--non-interactive')

  if (isInteractive) {
    const proceed = await confirm({
      message: `Copy .env from ${source}?`,
    })
    if (isCancel(proceed) || !proceed) {
      note(`Copy manually:\n\n  cp ${source} ${dest}`, 'Cancelled')
      logErr(label, 'Cancelled — .env required for dev')
      process.exit(1)
    }
  } else {
    logWarn(label, `Non-interactive: copying ${source} → ${dest}`)
  }

  try {
    await copyEnvFromPrimary(source, dest)
  } catch (e) {
    logErr(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

if (import.meta.main) {
  await ensureEnv()
}
