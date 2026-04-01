import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { getGeoDatabaseUrl } from './database-url.server'

// This is the client for accessing the geo data.
// It allows direct SQL queries to the database, so it should be used cautiously as it bypasses Prisma's integrated security checks.

const pool = new Pool({ connectionString: getGeoDatabaseUrl() })
const adapter = new PrismaPg(pool)
export const geoDataClient = new PrismaClient({ adapter })
