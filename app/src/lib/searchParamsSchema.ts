import { z } from 'zod'

export const optionalSearchString = () =>
  z.coerce
    .string()
    .optional()
    .transform((s) => (s === '' ? undefined : s))
