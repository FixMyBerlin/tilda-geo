#!/usr/bin/env bun
import { resolve } from 'node:path'
import { $ } from 'bun'

process.env.PATH = `/usr/local/bin:/opt/homebrew/bin:${process.env.HOME}/.docker/bin:${process.env.PATH ?? ''}`

// Path-based root: during `git push`, husky sets GIT_DIR and `git rev-parse --show-toplevel`
// from processing/ resolves to this package dir instead of the worktree/repo root.
const root = resolve(import.meta.dir, '../..')

const dockerCheck = await $`command -v docker`.quiet().nothrow()
if (dockerCheck.exitCode !== 0) {
  console.warn('docker not in PATH - skipping processing Docker tests.')
  console.log('Run manually: bun run test (in processing/)')
  process.exit(0)
}

const pingCheck = await $`ping -q -c 1 -W 1 8.8.8.8`.quiet().nothrow()
if (pingCheck.exitCode === 0) {
  console.log('Internet available - building Docker image...')
  await $`docker build --target testing -f ${root}/processing.Dockerfile -t test_img ${root}`
} else {
  console.warn('No internet connection - skipping Docker build and using cached image.')
}

await $`docker run --rm -v ${root}/processing:/processing test_img`
