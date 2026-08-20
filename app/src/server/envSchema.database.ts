import { z } from 'zod'
import { DEFAULT_DATABASE_PORT } from './envDefaultPorts'

const requiredString = z.string().min(1)

/** DB connection fields. `DATABASE_PORT` defaults when unset (local Docker / RDS 5432). */
export const databaseEnvSchema = z.object({
  DATABASE_HOST: requiredString,
  DATABASE_USER: requiredString,
  DATABASE_PASSWORD: requiredString,
  DATABASE_NAME: requiredString,
  DATABASE_PORT: z.string().min(1).default(DEFAULT_DATABASE_PORT),
})
