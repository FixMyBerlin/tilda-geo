import { styleText } from 'node:util'
import path from 'node:path'
import type { MetaData } from '../types'

/** @returns pmtiles outputFullFile */
export const generatePMTilesFile = async (
  inputFullFile: string,
  outputFolder: string,
  precision: Extract<MetaData, { dataSourceType: 'local' }>['geometricPrecision'],
) => {
  const outputFilename = path.parse(inputFullFile).name
  // This line is only used for `app/scripts/StaticDatasets/geojson/region-bb/bb-ramboll-netzentwurf-2/README.md`
  // const outputFullFile = path.join(outputFolder, `${outputFilename}.mbtiles`)
  const outputFullFile = path.join(outputFolder, `${outputFilename}.pmtiles`)

  const maxZoom = (() => {
    switch (precision) {
      // NOTE: We might want to change 'mask' to 'auto' and use the Tippecanoe auto discovery instead of a fixed maxzoom
      case 'mask':
        return 10
      case 'regular':
        return 14
      case 'high':
        // Testing: eUVM area data does not look square with lower values (in combination with extra-detail)
        //    https://tilda-geo.de/regionen/parkraum-berlin?map=18.9%2F52.47209%2F13.42965&config=1r6doko.4qfsxw.0&data=berlin-parking-polygons-euvm-phase2%2Cberlin-parking-polygons-euvm&v=2
        //    vs. https://viz.berlin.de/site/_masterportal/parkraumkartierung/index.html?MAPS={%22center%22:[393328.29599940975,5814690.745182172],%22mode%22:%222D%22,%22zoom%22:13}&MENU={%22main%22:{%22currentComponent%22:%22root%22},%22secondary%22:{%22currentComponent%22:%22root%22}}&LAYERS=[{%22id%22:%22basemap_raster_grau%22,%22visibility%22:true,%22transparency%22:40},{%22id%22:%22parkraumdaten_aussen%22,%22visibility%22:true},{%22id%22:%22parkraumdaten%22,%22visibility%22:true},{%22id%22:%22bezirke%22,%22visibility%22:true},{%22id%22:%22parkraumdaten_parkraumbewirtschaftung%22,%22visibility%22:false},{%22id%22:%22parkraumdaten_umweltzone%22,%22visibility%22:true}]&MAINCLOSED=true&lng=de
        return 15
      default:
        return 14 // fallback to 'regular'
    }
  })()

  console.log(
    `  Generating PMTiles file "${outputFullFile}"...`,
    precision ? styleText('yellow', JSON.stringify({ maxZoom })) : '',
  )

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

  const parameters = [
    `--output=${outputFullFile}`,
    '--force',
    '--layer=default',
    // CONFIG:
    // Lowest zoom level for which tiles are generated (default `0`) (`6` is all of Germany on a Laptop, `8` is a litte smaller than a State in Germany)
    '--minimum-zoom=7',
    // https://github.com/felt/tippecanoe#zoom-levels
    // The automatic --maximum-zoom didn't have the required precision.
    // Instead, we force a maximum-zoom of at least 15 (https://github.com/felt/tippecanoe#zoom-levels) … or higher.
    `--smallest-maximum-zoom-guess=${maxZoom}`,
    // Increase precision for overzooming https://github.com/felt/tippecanoe#tile-resolution
    // Note that `--full-detail` does not work for high facotrs like 20 and did not increase the precision enough for lower max zoom
    '--extra-detail=20', // the value is a factor (not a zoom-value)
    // Don't simplify lines and polygons at maxzoom (but do simplify at lower zooms)
    '--simplify-only-low-zooms',
    // Combine the area of very small polygons into small squares that represent their combined area only at zoom levels below the maximum.
    '--no-tiny-polygon-reduction-at-maximum-zoom',
    // Preserve typology when possible https://github.com/felt/tippecanoe#line-and-polygon-simplification
    '--no-simplification-of-shared-nodes',
    // https://github.com/felt/tippecanoe#zoom-levels
    // Increases precision but causes tile drops. => We cannot use this for everything
    // '--generate-variable-depth-tile-pyramid',
    //
    // Specify some level of detail indicator for max zoom. The number is not a zoom value but
    // https://github.com/felt/tippecanoe#tile-resolution
    // https://github.com/felt/tippecanoe/issues/89
    // ARCHIVE: we use those settings for eUVM: lines: 2, areas: 12
    // '--full-detail=23',
    //
    // If you use -rg, it will guess a drop rate that will keep at most 50,000 features in the densest tile https://github.com/felt/tippecanoe#dropping-a-fixed-fraction-of-features-by-zoom-level
    '-rg',
    // https://github.com/felt/tippecanoe#dropping-a-fraction-of-features-to-keep-under-tile-size-limits
    '--drop-densest-as-needed',
    // https://github.com/felt/tippecanoe#zoom-levels
    '--extend-zooms-if-still-dropping',
    inputFullFile,
  ]

  const { success, exitCode, stdout, stderr } = Bun.spawnSync(['tippecanoe', ...parameters], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (!success) {
    console.error(styleText('red', '  ERROR: tippecanoe failed. This needs to be fixed manually!'), {
      success,
      exitCode,
      stdout: stdout.toString(),
      stderr: stderr.toString(),
      command: `tippecanoe ${parameters.join(' ')}`,
    })
  }

  return outputFullFile
}
