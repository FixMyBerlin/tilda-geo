import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/prisma/generated/client'
import { getBaseDatabaseUrl } from './database-url.server'

declare global {
  var __prisma: PrismaClient | undefined
}

function createClient() {
  const adapter = new PrismaPg({
    connectionString: getBaseDatabaseUrl(),
  })
  return new PrismaClient({ adapter })
}

const db = globalThis.__prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}

export { PrismaClient }
export default db
