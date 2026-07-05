import { join } from 'node:path'
import { stopOrphanedTilesContainers, stopOtherRunningDevStacks } from './devStackDiscovery'
import {
  DEV_DB_PORT,
  DEV_TILES_PORT,
  isHostPortAvailable,
  publishedHostPorts,
} from './devStackPorts'
import {
  activeStackIdFromEnv,
  composeContainerPrefixFromEnv,
  devStackIdFromEnv,
  devStackPortsArePublished,
  isAttachMode,
} from './ensureDevStack'
import { repoRootFromApp } from './ensureEnv'
import { logErr, logOk, logWarn } from './predevLog'

const label = 'check_docker'

export async function checkDocker() {
  try {
    const attach = isAttachMode()
    const activeStackId = activeStackIdFromEnv()

    const stoppedOrphans = await stopOrphanedTilesContainers()
    if (stoppedOrphans.length > 0) {
      logWarn('check_docker', `Stopped orphaned tiles containers: ${stoppedOrphans.join(', ')}`)
    }

    const stopped = await stopOtherRunningDevStacks(activeStackId)
    if (stopped.length > 0) {
      const names = stopped.map((s) => s.stackId).join(', ')
      logWarn('check_docker', `Stopped other dev stacks: ${names}`)
    }

    if (attach) {
      const ready = await devStackPortsArePublished()
      if (ready) {
        logOk(`${label} (attached stack on ports ${DEV_DB_PORT}, ${DEV_TILES_PORT})`)
        return
      }
      logErr(
        label,
        `DEV_ATTACH_STACK is set but ports ${DEV_DB_PORT}, ${DEV_TILES_PORT} are not published — start the target stack first`,
      )
      process.exit(1)
    }

    const published = await publishedHostPorts()
    const dbPublished = published.has(DEV_DB_PORT)
    const tilesPublished = published.has(DEV_TILES_PORT)

    if (dbPublished && tilesPublished) {
      logOk(`${label} (stack already running on ports ${DEV_DB_PORT}, ${DEV_TILES_PORT})`)
      return
    }

    if (dbPublished || tilesPublished) {
      const busy = [
        dbPublished && `db port ${DEV_DB_PORT}`,
        tilesPublished && `tiles port ${DEV_TILES_PORT}`,
      ]
        .filter(Boolean)
        .join(', ')
      logErr(
        label,
        `Port conflict: ${busy} in use but not both stack ports — stop the other process or container`,
      )
      process.exit(1)
    }

    const dbFree = await isHostPortAvailable(DEV_DB_PORT)
    const tilesFree = await isHostPortAvailable(DEV_TILES_PORT)
    if (!dbFree || !tilesFree) {
      logErr(
        label,
        `Ports not available (db ${DEV_DB_PORT}: ${dbFree ? 'free' : 'busy'}, tiles ${DEV_TILES_PORT}: ${tilesFree ? 'free' : 'busy'})`,
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
    logOk(`${label} (started stack on ports ${DEV_DB_PORT}, ${DEV_TILES_PORT})`)
  } catch (e) {
    logErr(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

if (import.meta.main) {
  await checkDocker()
}
