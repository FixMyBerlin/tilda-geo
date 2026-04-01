import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { getPrismaCliDatabaseUrl } from './src/server/database-url.server'

// Config used by Prisma CLI tools (prisma migrate, prisma studio, prisma generate)
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seed.ts',
  },
  datasource: {
    url: getPrismaCliDatabaseUrl(),
  },
})
