export const transformGeopackageToGeojson = (input: string, output: string) => {
  console.log('  Run ogr2ogr')
  // Host PATH ogr2ogr (brew gdal locally). See app/README.md#host-binaries-local-vs-server
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
}
