import { NextResponse } from 'next/server'
import { corsHeaders } from '../_util/cors'
import { getMapillaryCoverageMetadata } from '../_util/getMapillaryCoverageMetadata'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const metadata = await getMapillaryCoverageMetadata()

    if (!metadata) {
      return NextResponse.json(
        { error: 'No metadata available' },
        { status: 404, headers: corsHeaders },
      )
    }

    return NextResponse.json(metadata, { headers: corsHeaders })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders },
    )
  }
}
