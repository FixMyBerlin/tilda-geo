function getDatabaseConfig() {
  const host = process.env.DATABASE_HOST
  const user = process.env.DATABASE_USER
  const password = process.env.DATABASE_PASSWORD
  const name = process.env.DATABASE_NAME

  if (!host || !user || !password || !name) {
    throw new Error(
      'Missing database env. Provide DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME.',
    )
  }

  return { host, user, password, name }
}

function encodeCredential(value: string) {
  return encodeURIComponent(value)
}

let passwordUrlEncodingWarned = false

function warnIfPasswordNeedsUrlEncoding(password: string) {
  if (password === encodeCredential(password) || passwordUrlEncodingWarned) return

  passwordUrlEncodingWarned = true
  console.warn(
    '[database-url] DATABASE_PASSWORD contains URL-unsafe characters (@, :, /, %, …). ' +
      'They are percent-encoded in the connection string; prefer a URL-safe password in new deployments.',
  )
}

export function getBaseDatabaseUrl() {
  const { host, user, password, name } = getDatabaseConfig()
  warnIfPasswordNeedsUrlEncoding(password)
  const port = process.env.DATABASE_PORT ?? '5432'
  return `postgresql://${encodeCredential(user)}:${encodeCredential(password)}@${host}:${port}/${name}`
}

// Note: The ?schema=prisma parameter is used by Prisma CLI (migrations, introspection, studio)
// For runtime queries via Pool adapter, we set search_path directly in db/index.ts
export function getPrismaCliDatabaseUrl() {
  return `${getBaseDatabaseUrl()}?schema=prisma`
}

// Long-running SELECTs on todos_lines hold ACCESS SHARE locks that block osm2pgsql CLUSTER
// (ACCESS EXCLUSIVE). Kill queries that exceed this limit so the nightly rebuild cannot stall again.
const GEO_STATEMENT_TIMEOUT_MS = '60000'
const GEO_LOCK_TIMEOUT_MS = '5000'

function getGeoPgSessionOptions() {
  return `-c statement_timeout=${GEO_STATEMENT_TIMEOUT_MS} -c lock_timeout=${GEO_LOCK_TIMEOUT_MS}`
}

export function getGeoDatabaseUrl() {
  const options = encodeURIComponent(getGeoPgSessionOptions())
  return `${getBaseDatabaseUrl()}?pool_timeout=0&options=${options}`
}
