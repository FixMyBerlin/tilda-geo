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

export function getBaseDatabaseUrl() {
  const { host, user, password, name } = getDatabaseConfig()
  // if (process.env.VITE_APP_ENV !== 'production') {
  //   console.log('Database URL', { host, user, password: '***', name })
  // }
  return `postgresql://${user}:${password}@${host}:5432/${name}`
}

// Note: The ?schema=prisma parameter is used by Prisma CLI (migrations, introspection, studio)
// For runtime queries via Pool adapter, we set search_path directly in db/index.ts
export function getPrismaCliDatabaseUrl() {
  return `${getBaseDatabaseUrl()}?schema=prisma`
}

export function getGeoDatabaseUrl() {
  return `${getBaseDatabaseUrl()}?pool_timeout=0`
}
