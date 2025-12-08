import { isProd } from '@/src/app/_components/utils/isEnv'
import { NextResponse } from 'next/server'
import { corsHeaders } from '../_util/cors'
import { getProcessingMeta } from '../_util/getProcessingMeta'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const parsed = await getProcessingMeta()

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
