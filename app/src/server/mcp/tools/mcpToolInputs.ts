import { z } from 'zod'

export const idInput = z.number().int().positive()

export const regionSlugInput = z
  .string()
  .min(1)
  .describe('Slug of the region to act in (see regions_list).')
