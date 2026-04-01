import { logErr, logOk } from './predevLog'

const label = '.env copy'
const cwd = process.cwd()
const envSrc = `${cwd}/../.env`
const envDest = `${cwd}/.env`

export async function copyEnv() {
  try {
    const content = await Bun.file(envSrc).text()
    await Bun.write(envDest, content)
    logOk(label)
  } catch (e) {
    logErr(label, e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}
