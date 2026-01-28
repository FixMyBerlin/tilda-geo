import { getIssues } from '@placemarkio/check-geojson'
import { styleText } from 'node:util'
import path from 'node:path'
import { import_ } from '../utils/import_'
import { addUniqueIds } from './addUniqueIds'
import { getDecompressedFilename } from './getDecompressedFilename'
import { validateProjection } from './validateProjection'

/** @returns geojson outputFullFilename which is either the initial geojson or the transformed geojson  */
export const transformFile = async (
  datasetFolderPath: string,
  geojsonFullFilename: string,
  outputFolder: string,
) => {
  const datasetFolderName = datasetFolderPath.split('/').at(-1)
  const filenameToRead = getDecompressedFilename({
    inputFilename: geojsonFullFilename,
    outputFilename: datasetFolderName,
    outputFolder,
  })
  let data = await Bun.file(filenameToRead).json()

  // INTERMEZZO: Do some checks on the file
  // Validate with placemarkio/check-geojson
  const issues = getIssues(JSON.stringify(data))
  if (issues.length > 0) {
    console.log(styleText('red', `  ERROR checking the GeoJSON file`), {
      file: filenameToRead,
      issues,
    })
  }
  // Validate projection
  validateProjection(data, filenameToRead)

  type TransformFunc = (data: any) => string
  const transform = await import_<TransformFunc>(datasetFolderPath, 'transform', 'transform')
  if (transform !== null) {
    console.log(`  Transforming geojson file...`)
    data = transform(data)
  }

  data = addUniqueIds(data)

  const outputFullFilename = path.join(outputFolder, `${datasetFolderName}.transformed.geojson`)
  await Bun.write(outputFullFilename, JSON.stringify(data, null, 2))
  return outputFullFilename
}
