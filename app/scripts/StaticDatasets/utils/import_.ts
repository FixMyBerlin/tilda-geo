import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { yellow } from './log'

/** @returns object or callable | null */
export const import_ = async <TModule extends ((...args: never) => unknown) | object>(
  folderName: string,
  moduleName: string,
  valueName: string,
) => {
  const moduleFileName = `${moduleName}.ts`
  const moduleFullFilename = path.join(folderName, moduleFileName)

  if (!fs.existsSync(moduleFullFilename)) {
    return null
  }

  const moduleUrl = pathToFileURL(path.resolve(moduleFullFilename)).href
  const module_ = await import(moduleUrl)

  if (!(valueName in module_)) {
    yellow(`  ${moduleFileName} does not export value "${valueName}".`)
    return null
  }
  return module_[valueName] as TModule
}
