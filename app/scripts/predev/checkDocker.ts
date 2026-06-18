import { join } from 'node:path'
import { isHostPortAvailable, publishedHostPorts } from './devStackPorts'
import {
  composeContainerPrefixFromEnv,
  devStackIdFromEnv,
  getStackPortsFromEnv,
  isAttachMode,
  stackPortsArePublished,
} from './ensureDevStack'
import { repoRootFromApp } from './ensureEnv'
import { logErr, logOk } from './predevLog'

const label = 'check_docker'

export async function checkDocker() {
  try {
    const { dbPort, tilesPort } = getStackPortsFromEnv()
    const attach = isAttachMode()

    if (attach) {
      const ready = await stackPortsArePublished()
      if (ready) {
        logOk(`${label} (attached stack on ports ${dbPort}, ${tilesPort})`)
        return
      }
      logErr(
        label,
        `DEV_ATTACH_STACK is set but ports ${dbPort}, ${tilesPort} are not published — start the target stack first`,
      )
      process.exit(1)
    }

    const published = await publishedHostPorts()
    const dbPublished = published.has(dbPort)
    const tilesPublished = published.has(tilesPort)

    if (dbPublished && tilesPublished) {
      logOk(`${label} (stack already running on ports ${dbPort}, ${tilesPort})`)
      return
    }

    if (dbPublished || tilesPublished) {
      const busy = [
        dbPublished && `DATABASE_PORT ${dbPort}`,
        tilesPublished && `TILES_PORT ${tilesPort}`,
      ]
        .filter(Boolean)
        .join(', ')
      logErr(
        label,
        `Port conflict: ${busy} in use but not both stack ports — pick other ports in .env.local`,
      )
      process.exit(1)
    }

    const dbFree = await isHostPortAvailable(dbPort)
    const tilesFree = await isHostPortAvailable(tilesPort)
    if (!dbFree || !tilesFree) {
      logErr(
        label,
        `Ports not available (db ${dbPort}: ${dbFree ? 'free' : 'busy'}, tiles ${tilesPort}: ${tilesFree ? 'free' : 'busy'})`,
      )
      process.exit(1)
    }

    const repoRoot = repoRootFromApp()
    const stackId = devStackIdFromEnv()
    const containerPrefix = composeContainerPrefixFromEnv()
    const proc = Bun.spawn(
      [
        'docker',
        'compose',
        ...(stackId ? ['-p', stackId] : []),
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
        env: {
          ...process.env,
          COMPOSE_DEV_CONTAINER_PREFIX: containerPrefix,
        },
      },
    )
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      throw new Error(`exit code ${exitCode}`)
    }
    logOk(`${label} (started stack on ports ${dbPort}, ${tilesPort})`)
  } catch (e) {
    logErr(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

if (import.meta.main) {
  await checkDocker()
}
