import { $ } from 'bun'
import { GEO_BOOTSTRAP_FLAGS } from './flags'

function geoBootstrapProcessingCommand() {
  return `bun run processing -- ${GEO_BOOTSTRAP_FLAGS.join(' ')}`
}

function extractComposeCommandLine(stdout: string) {
  const lines = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]!
    if (line.startsWith('( cd ') && line.includes('docker compose')) return line
  }
  return null
}

export async function resolveGeoBootstrapComposeLine() {
  const result = await $`bun run processing -- ${GEO_BOOTSTRAP_FLAGS}`.quiet().nothrow()
  if (result.exitCode === 0) {
    return extractComposeCommandLine(result.text())
  }
  return null
}

export async function printGeoBootstrapComposeLine() {
  const line = await resolveGeoBootstrapComposeLine()
  if (line) {
    console.log(line)
    return line
  }
  console.log(geoBootstrapProcessingCommand())
  console.error(
    '\nCould not expand to docker compose line — run the command above from app/, then paste the printed line.',
  )
  return null
}

export async function runGeoBootstrapComposeLine(line: string) {
  const proc = Bun.spawn(['sh', '-c', line], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: process.cwd(),
  })
  return proc.exited
}
