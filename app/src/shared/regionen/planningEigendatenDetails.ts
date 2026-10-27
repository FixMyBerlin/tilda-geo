import { z } from 'zod'

/**
 * `eigendaten_details` of a Flächenfinder hexagon, written by the planning worker
 * (`flaechenfinder/eigendaten.py`) as JSON text: per dataset either the points it added
 * (`p`, bonus/penalty) or `x: 1` when it excluded the hexagon.
 */
const EigendatenDetailsSchema = z.array(
  z.object({ id: z.string(), p: z.number().optional(), x: z.literal(1).optional() }),
)

/** Effect per dataset; empty for runs before the per-dataset breakdown and for coarse cells. */
export const parseEigendatenDetails = (value: unknown) => {
  if (typeof value !== 'string' || value === '') return []
  try {
    return EigendatenDetailsSchema.catch([]).parse(JSON.parse(value))
  } catch {
    return []
  }
}
