import path from 'node:path'
import { red } from '../utils/log'

/** @returns pmtiles outputFullFile */
export const generatePMTilesFile = async (inputFullFile: string, outputFolder: string) => {
  const outputFilename = path.parse(inputFullFile).name
  // This line is only used for `app/scripts/StaticDatasets/geojson/region-bb/bb-ramboll-netzentwurf-2/README.md`
  // const outputFullFile = path.join(outputFolder, `${outputFilename}.mbtiles`)
  const outputFullFile = path.join(outputFolder, `${outputFilename}.pmtiles`)

  console.log(`  Generating pmtiles file "${outputFullFile}"...`)

  // NOTE IMPROVEMENT: Check out https://github.com/amandasaurus/waterwaymap.org/blob/main/functions.sh#L20-L33
  // We should add those commands…
  // -n "OSM River Topologies" \
  // -N "Generated on $(date -I) from OSM data from ${FILE_TIMESTAMP:-OSMIUM_HEADER_MISSING} with $(osm-lump-ways --version) and argument $LUMP_ARGS" \
  // -A "© OpenStreetMap. Open Data under ODbL. https://osm.org/copyright" \
  //
  // NOTE IMPROVEMENT: We might want to make this an optional flag that we specify based on the meta.js?
  // The goal would be to have lines merged automatically instead of just dropped in spieces
  // BUT, the docs suggest it does not work for linestrings… https://github.com/felt/tippecanoe#dropping-a-fraction-of-features-to-keep-under-tile-size-limits
  // --coalesce-smallest-as-needed

  Bun.spawnSync(
    [
      'tippecanoe',
      `--output=${outputFullFile}`,
      '--force',
      // Don't simplify lines and polygons at maxzoom (but do simplify at lower zooms)
      '--simplify-only-low-zooms',
      // Combine the area of very small polygons into small squares that represent their combined area only at zoom levels below the maximum.
      '--no-tiny-polygon-reduction-at-maximum-zoom',
      // Preserve typology when possible https://github.com/felt/tippecanoe#line-and-polygon-simplification
      '--no-simplification-of-shared-nodes',
      // Lowest zoom level for which tiles are generated (default `0`) (`6` is all of Germany on a Laptop, `8` is a litte smaller than a State in Germany)
      '--minimum-zoom=7',
      //
      // // NOTE IMPROVEMENT eUVM: Reevaluate if we want to set something like this
      // // Automatically choose a maxzoom that should be sufficient to clearly distinguish the features and the detail within each feature https://github.com/felt/tippecanoe#zoom-levels
      // '--maximum-zoom=20',
      //
      // // NOTE IMPROVEMENT eUVM: Test out `full-detail` to increase precision at high zoom level
      // // https://github.com/felt/tippecanoe?tab=readme-ov-file#tile-resolution
      // // https://github.com/felt/tippecanoe/issues/89
      // '--full-detail=2', // we use those settings for eUVM: lines: 2, areas: 12
      //
      // Smallest maxzoom which is acceptable for our precision requirements, is higher, if tippecanoe guesses a higher maxzoom, it will be used ttps://github.com/felt/tippecanoe#zoom-levels
      // Automatic --maximum-zoom didn't have the required precision
      '--smallest-maximum-zoom-guess=8',
      // If you use -rg, it will guess a drop rate that will keep at most 50,000 features in the densest tile https://github.com/felt/tippecanoe#dropping-a-fixed-fraction-of-features-by-zoom-level
      '-rg',
      // https://github.com/felt/tippecanoe#dropping-a-fraction-of-features-to-keep-under-tile-size-limits
      '--drop-densest-as-needed',
      // https://github.com/felt/tippecanoe#zoom-levels
      '--extend-zooms-if-still-dropping',
      '--layer=default',
      inputFullFile,
    ],
    {
      onExit(_proc, exitCode, _signalCode, error) {
        if (exitCode) {
          red(`  exitCode: ${exitCode}`)
          process.exit(1)
        }
        if (error) {
          red(`  error: ${error.message}`)
          process.exit(1)
        }
      },
    },
  )

  return outputFullFile
}
