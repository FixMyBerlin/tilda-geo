export const transformGeopackageToGeojson = async (input: string, output: string) => {
  console.log('  Run ogr2ogr')
  Bun.spawnSync(['ogr2ogr', '-f', 'GeoJSON', output, input, '-lco', 'COORDINATE_PRECISION=8'], {
    onExit(_proc, exitCode, _signalCode, error) {
      exitCode && console.log('exitCode:', exitCode)
      error && console.log('error:', error)
    },
  })

  console.log('  Run prettier')
  Bun.spawnSync(['npx', 'prettier', '--write', output], {
    onExit(_proc, exitCode, _signalCode, error) {
      exitCode && console.log('exitCode:', exitCode)
      error && console.log('error:', error)
    },
  })
}
