import { checkDocker } from './checkDocker'
import { checkMigration } from './checkMigration'
import { checkPackageUpdates } from './checkPackageUpdates'
import { copyEnv } from './copyEnv'

const steps = [copyEnv, checkDocker, checkMigration, checkPackageUpdates]

for (const run of steps) {
  await run()
}
