import { isProd } from '@/components/shared/utils/isEnv'
import { registerSQLFunctions } from '@/server/instrumentation/registerSQLFunctions.server'
import { analysis } from '@/server/statistics/analysis/analysis.server'

async function runSafely(run: () => Promise<void>) {
  try {
    await run()
  } catch (e) {
    console.error('Statistics: Error', e)
    if (!isProd) throw e
  }
}

export async function runRegisterSqlFunctionsTask() {
  await runSafely(() => registerSQLFunctions())
}

export async function runStatisticsAnalysisTask() {
  await runSafely(() => analysis())
}

export async function runPostProcessingHookCombined() {
  await runSafely(async () => {
    await registerSQLFunctions()
    await analysis()
  })
}
