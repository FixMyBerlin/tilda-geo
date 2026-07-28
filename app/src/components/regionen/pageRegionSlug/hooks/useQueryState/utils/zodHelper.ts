import { z } from 'zod'

export const range = (min: number, max: number) => z.coerce.number().gte(min).lte(max)
export const longitude = range(-180, 180)
export const latitude = range(-90, 90)
