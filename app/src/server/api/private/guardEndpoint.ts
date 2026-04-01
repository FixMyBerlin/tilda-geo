import { z } from 'zod'
import { compareApiKeyTimingSafe } from '../util/checkApiKey.server'

export const GuardEndpointSchema = z.object({
  apiKey: z.string(),
})

export function guardEndpoint(req: Request, schema: z.ZodObject<{ apiKey: z.ZodString }>) {
  const requestUrl = new URL(req.url)
  const params = schema.safeParse(Object.fromEntries(requestUrl.searchParams.entries()))
  if (params.success === false) {
    console.error("Couldn't parse query string", params.error)
    return {
      access: false as const,
      params,
      response: Response.json({ error: 'Invalid input', ...params.error }, { status: 400 }),
    }
  }
  if (!compareApiKeyTimingSafe(params.data.apiKey)) {
    return {
      access: false as const,
      params,
      response: Response.json({ message: 'Forbidden' }, { status: 403 }),
    }
  }
  return { access: true as const, params, response: null }
}
