export const pendingMigrationsBanner = /Following migrations? have not yet been applied/

export function classifyMigrateStatus(output: string, prismaExitCode: number | null | undefined) {
  if (pendingMigrationsBanner.test(output)) {
    return 10
  }
  if (prismaExitCode === 0 && output.trim().length > 0) {
    return 0
  }
  return 1
}
