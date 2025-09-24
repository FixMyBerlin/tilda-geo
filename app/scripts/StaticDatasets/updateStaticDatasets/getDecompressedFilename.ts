import fs from 'node:fs'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import { red } from '../utils/log'

/** @description Check the file. If compressed, copy it, uncompress it, return that filename. */
export const getDecompressedFilename = ({ inputFilename, outputFilename, outputFolder }) => {
  if (path.parse(inputFilename).ext === '.gz') {
    // When our input is zipped, we decompress it directly using native zlib
    console.log(`  Unzipping file...`)
    const decompressedFilename = path.join(outputFolder, `${outputFilename}.decompressed.geojson`)

    try {
      const compressedData = fs.readFileSync(inputFilename)
      const decompressedData = gunzipSync(compressedData)
      fs.writeFileSync(decompressedFilename, decompressedData)
      return decompressedFilename
    } catch (error) {
      red('ERROR with native zlib gunzip decompression:', error.message)
      throw error
    }
  }
  return inputFilename
}
