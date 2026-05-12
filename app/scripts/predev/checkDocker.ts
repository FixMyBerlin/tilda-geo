import { join } from 'node:path'
import { logErr, logOk } from './predevLog'

const label = 'check_docker'

export async function checkDocker() {
  try {
    const repoRoot = join(process.cwd(), '..')
    const proc = Bun.spawn(
      [
        'docker',
        'compose',
        '-f',
        join(repoRoot, 'docker-compose.yml'),
        '-f',
        join(repoRoot, 'docker-compose.override.yml'),
        'up',
        'db',
        'tiles',
        '-d',
      ],
      {
        cwd: repoRoot,
        stdout: 'inherit',
        stderr: 'inherit',
      },
    )
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      throw new Error(`exit code ${exitCode}`)
    }
    logOk(label)
  } catch (e) {
    logErr(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

if (import.meta.main) {
  await checkDocker()
}
