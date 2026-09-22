#!/usr/bin/env bun
import { $ } from 'bun'

// Dev compose only (`docker-compose.override.yml`). Named volume hides image node_modules;
// refresh it when the bind-mounted bun.lock no longer matches the stamp from the last install.
const lockFile = Bun.file('/processing/bun.lock')
const stampFile = Bun.file('/processing/node_modules/.processing-bun-lock-hash')

const hasher = new Bun.CryptoHasher('sha256')
hasher.update(await lockFile.arrayBuffer())
const hash = hasher.digest('hex')

const current = (await stampFile.exists()) ? (await stampFile.text()).trim() : ''
if (current !== hash) {
  console.log('processing node_modules: bun.lock changed, running bun install…')
  await $`bun install`.cwd('/processing')
  await Bun.write(stampFile, hash)
}

const [command, ...args] = Bun.argv.slice(2)
if (!command) process.exit(0)
await $`${command} ${args}`.cwd('/processing')
