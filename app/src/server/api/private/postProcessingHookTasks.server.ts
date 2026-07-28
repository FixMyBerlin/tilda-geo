import { isProd } from '@/components/shared/utils/isEnv'
import { registerSQLFunctions } from '@/server/instrumentation/registerSQLFunctions.server'

async function runSafely(run: () => Promise<void>) {
  try {
    await run()
  } catch (e) {
    console.error('Post-processing hook: Error', e)
    if (!isProd) throw e
  }
}

export async function runRegisterSqlFunctionsTask() {
  await runSafely(() => registerSQLFunctions())
}

export async function runPostProcessingHookCombined() {
  await runSafely(() => registerSQLFunctions())
}
