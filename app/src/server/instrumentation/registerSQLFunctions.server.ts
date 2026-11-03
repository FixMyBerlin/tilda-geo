import { styleText } from 'node:util'
import { registerGeneralizationFunctions } from './registerGeneralizationFunctions.server'
import { registerSpaceFinderFunctions } from './registerSpaceFinderFunctions.server'
import { pluginOk } from './utils/pluginLog'

export async function registerSQLFunctions() {
  try {
    const generalizationFunctionPromise = registerGeneralizationFunctions().then(() =>
      pluginOk('[generalization]', 'Generalization functions registered'),
    )

    const spaceFinderFunctionPromise = registerSpaceFinderFunctions().then(() =>
      pluginOk('[spaceFinder]', 'Flächenfinder tile functions registered'),
    )

    await Promise.all([generalizationFunctionPromise, spaceFinderFunctionPromise])
  } catch (error) {
    console.error(styleText('red', 'INSTRUMENTATION HOOK FAILED'), 'registerSQLFunctions', error)
  }
}
