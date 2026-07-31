import '@/lib/zodDeLocale'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/prisma/generated/client'
import { extendWithAuditLog } from '@/server/audit/prismaAuditExtensions.server'
import { getBaseDatabaseUrl } from './database-url.server'

declare global {
  var __prisma: ReturnType<typeof createClient> | undefined
}

function createClient() {
  const adapter = new PrismaPg({
    connectionString: getBaseDatabaseUrl(),
  })
  const base = new PrismaClient({ adapter })
  return extendWithAuditLog(base)
}

const db = globalThis.__prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}

export default db
