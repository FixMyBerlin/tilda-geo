import { z } from 'zod'

export const mapillaryDataDatesSchema = z.object({
  ml_data_from: z.coerce.date(),
})

export const osmDataDatesSchema = z.object({
  osm_data_from: z.coerce.date(),
})
