#!/usr/bin/env bun
import { $ } from 'bun'

process.env.PATH = `/usr/local/bin:/opt/homebrew/bin:${process.env.HOME}/.docker/bin:${process.env.PATH ?? ''}`

const root = (await $`git rev-parse --show-toplevel`.quiet()).text().trim()
if (!root) {
  console.error('Not inside a git repository.')
  process.exit(1)
}

await $`bun ./processing/scripts/update-lua-package-paths.ts`.cwd(root)

const dockerCheck = await $`command -v docker`.quiet().nothrow()
if (dockerCheck.exitCode !== 0) {
  console.warn('docker not in PATH - skipping LuaLS typecheck.')
  console.log('Run manually: bun run typecheck (in processing/)')
  process.exit(0)
}

const pingCheck = await $`ping -q -c 1 -W 1 8.8.8.8`.quiet().nothrow()
if (pingCheck.exitCode === 0) {
  console.log('Internet available - building Docker image...')
  await $`docker build --target processing -f ${root}/processing.Dockerfile -t processing_typecheck_img ${root}`
} else {
  console.warn('No internet connection - skipping Docker build and using cached image.')
}

await $`docker run --rm --entrypoint bun -v ${root}/processing:/processing processing_typecheck_img /processing/scripts/typecheck-lua-in-container.ts`
