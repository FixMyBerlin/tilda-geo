import { logErr, logOk } from './predevLog'

const label = 'check_docker'
const cwd = process.cwd()

export async function checkDocker() {
  try {
    const proc = Bun.spawn(
      [
        'sh',
        '-c',
        `if [ "$(docker inspect -f '{{.State.Running}}' db)" != "true" ]; then docker compose -f ${cwd}/../docker-compose.yml up db tiles -d; fi`,
      ],
      {
        cwd,
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
