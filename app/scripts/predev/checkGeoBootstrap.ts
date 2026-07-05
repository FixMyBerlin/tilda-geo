import { note } from '@clack/prompts'
import { describeGeoMetaProbeIssue, geoMetaProbeOk, probeGeoMeta } from '../geo-bootstrap/probe'
import { logOk, logWarn } from './predevLog'

const label = 'check_geo_bootstrap'

function showGeoBootstrapTip(issue: string) {
  const body = `${issue}\n\nRun \`bun run seed\` from \`app/\` (Docker db must be running).`

  if (process.stdin.isTTY) {
    note(body, 'Geo bootstrap')
    logWarn(label, issue)
    return
  }

  logWarn(label, issue)
  console.log(`\n${body}\n`)
}

export async function checkGeoBootstrap() {
  const probe = await probeGeoMeta()

  if (geoMetaProbeOk(probe)) {
    logOk(label)
    return
  }

  showGeoBootstrapTip(describeGeoMetaProbeIssue(probe))
}

if (import.meta.main) {
  try {
    await checkGeoBootstrap()
  } catch (e) {
    logWarn(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}
