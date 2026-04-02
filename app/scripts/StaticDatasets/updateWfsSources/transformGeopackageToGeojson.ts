export const transformGeopackageToGeojson = (input: string, output: string) => {
  console.log('  Run ogr2ogr')
  Bun.spawnSync(['ogr2ogr', '-f', 'GeoJSON', output, input, '-lco', 'COORDINATE_PRECISION=8'], {
    onExit(_proc, exitCode, _signalCode, error) {
      if (exitCode) {
        console.log('exitCode:', exitCode)
      }
      if (error) {
        console.log('error:', error)
      }
    },
  })

  console.log('  Run oxfmt')
  Bun.spawnSync(['bunx', 'oxfmt', '--write', output], {
    onExit(_proc, exitCode, _signalCode, error) {
      if (exitCode) {
        console.log('exitCode:', exitCode)
      }
      if (error) {
        console.log('error:', error)
      }
    },
  })
}
