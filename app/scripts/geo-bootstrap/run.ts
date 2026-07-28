import {
  printGeoBootstrapComposeLine,
  resolveGeoBootstrapComposeLine,
  runGeoBootstrapComposeLine,
} from './compose'

export async function runGeoBootstrap() {
  const line = await resolveGeoBootstrapComposeLine()
  if (!line) {
    await printGeoBootstrapComposeLine()
    throw new Error('Could not build geo bootstrap compose command')
  }
  console.log('Geo bootstrap…')
  console.log(line)
  const code = await runGeoBootstrapComposeLine(line)
  if (code !== 0) {
    throw new Error(`Geo bootstrap failed (exit ${code ?? 1})`)
  }
}

if (import.meta.main) {
  runGeoBootstrap().catch((e) => {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  })
}
