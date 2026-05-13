import { z } from 'zod'

export const staticDatasetCategorySegmentSchema = z
  .string()
  .trim()
  .min(1)
  .max(190)
  .refine((s) => !s.includes('/'), 'Darf kein „/“ enthalten')
