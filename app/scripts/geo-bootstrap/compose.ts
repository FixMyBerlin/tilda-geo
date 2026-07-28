import path from 'node:path'
import { GEO_BOOTSTRAP_FLAGS } from './flags'

const processingScriptPath = path.join(import.meta.dir, '../processing-generate-command/index.ts')
const appRoot = path.join(import.meta.dir, '../..')

function geoBootstrapProcessingCommand() {
  return `bun ${processingScriptPath} -- ${GEO_BOOTSTRAP_FLAGS.join(' ')}`
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
  const proc = Bun.spawn(['bun', processingScriptPath, '--', ...GEO_BOOTSTRAP_FLAGS], {
    cwd: appRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const exitCode = await proc.exited
  if (exitCode === 0) {
    const stdout = await new Response(proc.stdout).text()
    return extractComposeCommandLine(stdout)
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
