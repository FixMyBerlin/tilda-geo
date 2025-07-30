import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const GuardEnpointSchema = z.object({
  apiKey: z.string(),
})

export function guardEnpoint(req: NextRequest, schema: z.ZodObject<{ apiKey: z.ZodString }, any>) {
  // Parse and validate the query string
  const requestUrl = new URL(req.url)
  const params = schema.safeParse(Object.fromEntries(requestUrl.searchParams.entries()))
  if (params.success == false) {
    console.error("Couldn't parse query string", params.error)
    return {
      access: false,
      params,
      response: NextResponse.json({ error: 'Invalid input', ...params.error }, { status: 400 }),
    }
  }
  if (params.data.apiKey !== process.env.ATLAS_API_KEY) {
    return {
      access: false,
      params,
      response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    }
  }
  return { access: true, params, response: null }
}
