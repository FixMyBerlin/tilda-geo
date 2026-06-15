function getDatabaseConfig() {
  const host = process.env.DATABASE_HOST
  // Optional: defaults to 5432. Lets an isolated dev worktree connect to a DB
  // published on a non-default host port (see DATABASE_PORT in docker-compose.yml).
  const port = process.env.DATABASE_PORT || '5432'
  const user = process.env.DATABASE_USER
  const password = process.env.DATABASE_PASSWORD
  const name = process.env.DATABASE_NAME

  if (!host || !user || !password || !name) {
    throw new Error(
      'Missing database env. Provide DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME.',
    )
  }

  return { host, port, user, password, name }
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
  const { host, port, user, password, name } = getDatabaseConfig()
  warnIfPasswordNeedsUrlEncoding(password)
  return `postgresql://${encodeCredential(user)}:${encodeCredential(password)}@${host}:${port}/${name}`
}

// Note: The ?schema=prisma parameter is used by Prisma CLI (migrations, introspection, studio)
// For runtime queries via Pool adapter, we set search_path directly in db/index.ts
export function getPrismaCliDatabaseUrl() {
  return `${getBaseDatabaseUrl()}?schema=prisma`
}

export function getGeoDatabaseUrl() {
  return `${getBaseDatabaseUrl()}?pool_timeout=0`
}

/** @internal Resets one-shot warning state for tests. */
export function resetDatabaseUrlWarningsForTests() {
  passwordUrlEncodingWarned = false
}
