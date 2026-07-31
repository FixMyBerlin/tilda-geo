import '@/lib/zodDeLocale'
import '@testing-library/jest-dom'

// Avoid "Missing database env" when test files import code that loads prisma/database-url at module load.
// Unit tests that only exercise pure logic never connect; integration tests skip when CI or DB is unavailable.
if (!process.env.DATABASE_HOST) {
  process.env.DATABASE_HOST = 'localhost'
  process.env.DATABASE_USER = 'test'
  process.env.DATABASE_PASSWORD = 'test'
  process.env.DATABASE_NAME = 'test'
}
