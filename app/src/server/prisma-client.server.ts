import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/prisma/generated/client'
import { getGeoDatabaseUrl } from './database-url.server'

// This is the client for accessing the geo data.
// It allows direct SQL queries to the database, so it should be used cautiously as it bypasses Prisma's integrated security checks.

// Pass the connection config (not a `pg.Pool` instance) to PrismaPg. The adapter creates its own
// pool internally using the `pg` copy it bundles. Handing it a Pool from the app's own `pg` is
// fragile: if the two `pg` versions differ, the adapter's `instanceof Pool` check fails, treats the
// Pool as a plain config object, and crashes pg's startup with `ERR_INVALID_ARG_TYPE`.
const adapter = new PrismaPg({ connectionString: getGeoDatabaseUrl() })
export const geoDataClient = new PrismaClient({ adapter })
