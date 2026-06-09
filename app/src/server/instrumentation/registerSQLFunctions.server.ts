import { styleText } from 'node:util'
import { registerGeneralizationFunctions } from './registerGeneralizationFunctions.server'
import { registerPlanningFunctions } from './registerPlanningFunctions.server'
import { pluginOk } from './utils/pluginLog'

export async function registerSQLFunctions() {
  try {
    const generalizationFunctionPromise = registerGeneralizationFunctions().then(() =>
      pluginOk('[generalization]', 'Generalization functions registered'),
    )

    const planningFunctionPromise = registerPlanningFunctions().then(() =>
      pluginOk('[planning]', 'Planning tile functions registered'),
    )

    await Promise.all([generalizationFunctionPromise, planningFunctionPromise])
  } catch (error) {
    console.error(styleText('red', 'INSTRUMENTATION HOOK FAILED'), 'registerSQLFunctions', error)
  }
}
