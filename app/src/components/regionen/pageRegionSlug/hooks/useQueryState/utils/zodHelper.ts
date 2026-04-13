import { z } from 'zod'

export const range = (min, max) => z.coerce.number().gte(min).lte(max)
export const longitude = range(-180, 180)
export const latitude = range(-90, 90)
