import { z } from 'zod'

export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, 'Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten')
