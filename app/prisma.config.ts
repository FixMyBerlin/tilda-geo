import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'
import { applyDevPortSlotToProcessEnv } from './scripts/predev/devPortSlot'
import { getPrismaCliDatabaseUrl } from './src/server/database-url.server'

// Mirror vite.config.ts: repo-root env, then derive DATABASE_PORT from DEV_PORT_SLOT
// so migrate/seed/studio hit the same Postgres as the worktree Docker stack.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
dotenv.config({ path: `${repoRoot}/.env` })
dotenv.config({ path: `${repoRoot}/.env.local` })
applyDevPortSlotToProcessEnv()

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
