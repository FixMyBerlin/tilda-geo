#!/usr/bin/env bun
import { watch } from 'node:fs'
import path from 'node:path'
import { $ } from 'bun'
import { main } from './index'
import { inputRoot } from './paths'

const appDir = path.resolve(import.meta.dir, '../..')
const debounceMs = 400

let debounceTimer: ReturnType<typeof setTimeout> | undefined
let running = false
let pending = false

const formatGenerated = async () => {
  const out = await $`bun run topic-docs-build:2format`.cwd(appDir).nothrow()
  if (out.exitCode !== 0) process.exit(out.exitCode ?? 1)
}

const runBuild = async () => {
  if (running) {
    pending = true
    return
  }
  running = true
  pending = false
  try {
    await main()
    await formatGenerated()
    console.log('[topic-docs-watch] rebuild OK')
  } catch (err) {
    console.error('[topic-docs-watch] build failed:', err)
  } finally {
    running = false
    if (pending) {
      pending = false
      void runBuild()
    }
  }
}

const schedule = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined
    void runBuild()
  }, debounceMs)
}

const watcher = watch(inputRoot, { recursive: true }, () => {
  schedule()
})

const shutdown = () => {
  watcher.close()
  if (debounceTimer) clearTimeout(debounceTimer)
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.log(`[topic-docs-watch] watching ${inputRoot}`)
void runBuild()
