import { greenCheckmark } from './_utils/greenCheckmark'
import { registerGeneralizationFunctions } from './registerGeneralizationFunctions'

export async function registerSQLFunctions() {
  try {
    const generalizationFunctionPromise = registerGeneralizationFunctions().then(() =>
      console.log(greenCheckmark, 'Generalization functions registered'),
    )

    await Promise.all([generalizationFunctionPromise])
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'INSTRUMENTATION HOOK FAILED', 'registerSQLFunctions', error)
  }
}
