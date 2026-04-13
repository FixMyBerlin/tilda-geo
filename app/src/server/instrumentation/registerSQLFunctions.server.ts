import { styleText } from 'node:util'
import { registerGeneralizationFunctions } from './registerGeneralizationFunctions.server'
import { pluginOk } from './utils/pluginLog'

export async function registerSQLFunctions() {
  try {
    const generalizationFunctionPromise = registerGeneralizationFunctions().then(() =>
      pluginOk('[generalization]', 'Generalization functions registered'),
    )

    await Promise.all([generalizationFunctionPromise])
  } catch (error) {
    console.error(styleText('red', 'INSTRUMENTATION HOOK FAILED'), 'registerSQLFunctions', error)
  }
}
