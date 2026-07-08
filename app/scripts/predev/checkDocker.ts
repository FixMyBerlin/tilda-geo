import { join } from 'node:path'
import {
  applyDevPortSlotToProcessEnv,
  exitOnInvalidDevPortSlot,
  isDevPortSlotMode,
} from './devPortSlot'
import {
  getRunningStackPublishedPorts,
  stopOrphanedTilesContainers,
  stopOtherRunningDevStacks,
} from './devStackDiscovery'
import { isHostPortAvailable, publishedHostPorts } from './devStackPorts'
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
    exitOnInvalidDevPortSlot(label)
    const { databasePort, tilesPort } = applyDevPortSlotToProcessEnv()
    const slotMode = isDevPortSlotMode()
    const attach = isAttachMode()
    const activeStackId = activeStackIdFromEnv()

    if (slotMode) {
      const stackId = devStackIdFromEnv()
      if (stackId) {
        const running = await getRunningStackPublishedPorts(stackId)
        if (running && (running.databasePort !== databasePort || running.tilesPort !== tilesPort)) {
          logErr(
            label,
            `DEV_STACK_ID "${stackId}" is already running on ports ${running.databasePort}/${running.tilesPort} — use a different worktree/.env.local DEV_STACK_ID or stop it`,
          )
          process.exit(1)
        }
      }
    }

    if (!slotMode) {
      const stoppedOrphans = await stopOrphanedTilesContainers()
      if (stoppedOrphans.length > 0) {
        logWarn('check_docker', `Stopped orphaned tiles containers: ${stoppedOrphans.join(', ')}`)
      }

      const stopped = await stopOtherRunningDevStacks(activeStackId)
      if (stopped.length > 0) {
        const names = stopped.map((s) => s.stackId).join(', ')
        logWarn('check_docker', `Stopped other dev stacks: ${names}`)
      }
    }

    if (attach) {
      const ready = await devStackPortsArePublished()
      if (ready) {
        logOk(`${label} (attached stack on ports ${databasePort}, ${tilesPort})`)
        return
      }
      logErr(
        label,
        `DEV_ATTACH_STACK is set but ports ${databasePort}, ${tilesPort} are not published — start the target stack first`,
      )
      process.exit(1)
    }

    const published = await publishedHostPorts()
    const dbPublished = published.has(databasePort)
    const tilesPublished = published.has(tilesPort)

    if (dbPublished && tilesPublished) {
      logOk(`${label} (stack already running on ports ${databasePort}, ${tilesPort})`)
      return
    }

    if (dbPublished || tilesPublished) {
      const busy = [
        dbPublished && `db port ${databasePort}`,
        tilesPublished && `tiles port ${tilesPort}`,
      ]
        .filter(Boolean)
        .join(', ')
      logErr(
        label,
        `Port conflict: ${busy} in use but not both stack ports — stop the other process or container`,
      )
      process.exit(1)
    }

    const dbFree = await isHostPortAvailable(databasePort)
    const tilesFree = await isHostPortAvailable(tilesPort)
    if (!dbFree || !tilesFree) {
      logErr(
        label,
        `Ports not available (db ${databasePort}: ${dbFree ? 'free' : 'busy'}, tiles ${tilesPort}: ${tilesFree ? 'free' : 'busy'})`,
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
          DATABASE_PORT: String(databasePort),
          TILES_PORT: String(tilesPort),
        },
      },
    )
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      throw new Error(`exit code ${exitCode}`)
    }
    logOk(`${label} (started stack on ports ${databasePort}, ${tilesPort})`)
  } catch (e) {
    logErr(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

if (import.meta.main) {
  await checkDocker()
}
