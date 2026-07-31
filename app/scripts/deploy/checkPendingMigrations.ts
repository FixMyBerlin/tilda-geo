/**
 * Deploy-time helper: exit codes tell the SSH caller whether to run a Scaleway
 * backup before `docker compose up` (which runs `prisma migrate deploy`).
 *
 * Exit 0  — schema up to date (skip backup)
 * Exit 10 — pending migrations (run backup, then up)
 * Exit 1  — could not determine status (abort deploy)
 */
import { $ } from 'bun'
import { classifyMigrateStatus } from './classifyMigrateStatus'

const result = await $`bunx prisma migrate status`.quiet().nothrow()
const output = `${result.stdout.toString()}${result.stderr.toString()}`

if (output.trim()) {
  console.log(output.trimEnd())
}

const exitCode = classifyMigrateStatus(output, result.exitCode)

if (exitCode === 10) {
  console.log('Pending migrations detected.')
} else if (exitCode === 0) {
  console.log('Database schema is up to date.')
} else if (!output.trim()) {
  console.error(`prisma migrate status failed with exit code ${result.exitCode ?? 'unknown'}`)
}

process.exit(exitCode)
