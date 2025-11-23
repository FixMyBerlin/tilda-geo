import { isProd } from '@/src/app/_components/utils/isEnv'
import { geoDataClient } from '@/src/server/prisma-client'
import { ProcessingMetaDate, ProcessingMetaDates } from '@/src/server/regions/schemas'
import { NextResponse } from 'next/server'
import { corsHeaders } from '../_util/cors'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [result] = await geoDataClient.$queryRaw<ProcessingMetaDate[]>`
      SELECT status, processed_at, osm_data_from, processing_started_at
      FROM public.meta
      ORDER BY id DESC
      LIMIT 1
    `
    const parsed = ProcessingMetaDates.parse(result)

    return NextResponse.json(parsed, { headers: corsHeaders })
  } catch (error) {
    console.error(error) // Log files
    return Response.json(
      {
        error: 'Internal Server Error',
        info: isProd ? undefined : error,
      },
      { status: 500, headers: corsHeaders },
    )
  }
}
