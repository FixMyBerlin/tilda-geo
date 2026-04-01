#!/usr/bin/env bun
import * as p from '@clack/prompts'

const OPTIONS = [
  { value: 'major-check-install', label: 'Major – check and install (default)' },
  { value: 'major-check-only', label: 'Major – check only' },
  { value: 'minor-check-install', label: 'Minor – check and install' },
  { value: 'minor-check-only', label: 'Minor – check only' },
] as const

type Option = (typeof OPTIONS)[number]['value']

p.intro('update')

const choice = await p.select({
  message: 'Update mode',
  options: OPTIONS.map((o) => ({ value: o.value, label: o.label })),
})

if (p.isCancel(choice)) {
  p.cancel('Aborted.')
  process.exit(0)
}

const mode = choice as Option

async function run(cmd: string[], label: string) {
  const proc = Bun.spawn(cmd, {
    cwd: process.cwd(),
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  })
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    p.log.error(`${label} failed (exit ${exitCode})`)
    process.exit(exitCode)
  }
}

async function taze(mode: 'major' | 'minor', write: boolean) {
  const args = ['taze', mode, '--includeLocked']
  if (write) args.push('--write')
  await run(['bunx', ...args], `taze ${mode}`)
}

switch (mode) {
  case 'major-check-install': {
    await taze('major', true)
    const spinner = p.spinner()
    spinner.start('Running bun install…')
    await run(['bun', 'install'], 'bun install')
    spinner.stop('Done.')
    break
  }
  case 'major-check-only': {
    await taze('major', false)
    break
  }
  case 'minor-check-install': {
    await taze('minor', true)
    const spinner = p.spinner()
    spinner.start('Running bun install…')
    await run(['bun', 'install'], 'bun install')
    spinner.stop('Done.')
    break
  }
  case 'minor-check-only': {
    await taze('minor', false)
    break
  }
}

p.outro('Done.')
