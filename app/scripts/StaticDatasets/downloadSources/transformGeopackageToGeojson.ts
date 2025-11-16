export const transformGeopackageToGeojson = async (input: string, output: string) => {
  console.log('  Run ogr2ogr')
  Bun.spawnSync(
    [
      'ogr2ogr',
      '-f',
      'GeoJSON',
      output,
      input,
      // Topological simplification: ~0.5 m precision (in degrees for EPSG:4326: 0.5m ≈ 0.0000045°)
      // Uses OGRGeometry::SimplifyPreserveTopology() which preserves topology within features
      '-simplify',
      '0.0000045',
      // Only 8 digits precision
      '-lco',
      'COORDINATE_PRECISION=8',
    ],
    {
      onExit(_proc, exitCode, _signalCode, error) {
        exitCode && console.log('exitCode:', exitCode)
        error && console.log('error:', error)
      },
    },
  )

  console.log('  Run prettier')
  Bun.spawnSync(['npx', 'prettier', '--write', output], {
    onExit(_proc, exitCode, _signalCode, error) {
      exitCode && console.log('exitCode:', exitCode)
      error && console.log('error:', error)
    },
  })
}
