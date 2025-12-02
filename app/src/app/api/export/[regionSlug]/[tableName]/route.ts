import db from '@/db'
import { formatDateBerlin } from '@/src/app/_components/date/formatDateBerlin'
import { isProd } from '@/src/app/_components/utils/isEnv'
import { getProcessingMeta } from '@/src/app/api/_util/getProcessingMeta'
import {
  exportApiIdentifier,
  exportFunctionIdentifier,
} from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/export/exportIdentifier'
import { getBlitzContext } from '@/src/blitz-server'
import { geoDataClient } from '@/src/server/prisma-client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ExportSchema = z.object({
  regionSlug: z.string(),
  tableName: z.enum(exportApiIdentifier),
  apiKey: z.string().optional(),
  minlon: z.coerce.number(),
  minlat: z.coerce.number(),
  maxlon: z.coerce.number(),
  maxlat: z.coerce.number(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { regionSlug: string; tableName: string } },
) {
  const rawSearchParams = request.nextUrl.searchParams
  const parsedParams = ExportSchema.safeParse({
    regionSlug: params.regionSlug,
    tableName: params.tableName,
    apiKey: rawSearchParams.get('apiKey') || '',
    minlon: rawSearchParams.get('minlon'),
    minlat: rawSearchParams.get('minlat'),
    maxlon: rawSearchParams.get('maxlon'),
    maxlat: rawSearchParams.get('maxlat'),
  })

  // VALIDATE PARAMS
  if (parsedParams.success === false) {
    const error = { error: 'Invalid input', ...parsedParams.error }
    console.error(error) // Log files
    return NextResponse.json(error, { status: 400 })
  }
  const { regionSlug, tableName, apiKey, minlon, minlat, maxlon, maxlat } = parsedParams.data

  // ACCESS CONTROL
  // calling an anonymous function to easily break out of nested ifs
  const status = await (async () => {
    // When apiKey valid, we ignore the region check
    if (apiKey === process.env.ATLAS_API_KEY) {
      return 200 // <==========
    }

    const region = await db.region.findFirst({ where: { slug: regionSlug } })
    if (!region) {
      return 404 // <==========
    }

    if (region.exportPublic === true) {
      return 200 // <==========
    }

    const { session } = await getBlitzContext()
    const { userId, role } = session

    if (!userId) {
      return 403 // <==========
    }

    if (role === 'ADMIN') {
      return 200 // <==========
    }

    const membershipExists = !!(await db.membership.count({
      where: { userId, region: { slug: regionSlug } },
    }))
    if (!membershipExists) {
      return 403 // <==========
    }

    // LATER: Check input bounding box if inside region bbox

    return 200 // <==========
  })()

  if (status !== 200) {
    return Response.json(status, { status })
  }

  // DATA
  try {
    const functionName = exportFunctionIdentifier(tableName)

    const [binaryResponse] = await geoDataClient.$queryRawUnsafe<{ data: Buffer }[]>(
      `SELECT * FROM "${functionName}"(
        ( SELECT * FROM ST_SetSRID(ST_MakeEnvelope(${minlon}, ${minlat}, ${maxlon}, ${maxlat}), 4326) )
      ) AS data`, // `AS data` corresponts to <{ data: Buffer }>
    )

    // Include OSM data date in filename for versioning (using Berlin timezone)
    const metadata = await getProcessingMeta()
    const filename = metadata.osm_data_from
      ? `${tableName}_${formatDateBerlin(metadata.osm_data_from, 'yyyy-MM-dd')}.fgb`
      : `${tableName}.fgb`

    return new Response(
      binaryResponse?.data ? (binaryResponse.data as unknown as BodyInit) : null,
      {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(binaryResponse?.data?.byteLength),
        },
      },
    )
  } catch (error) {
    console.error(error) // Log files
    return Response.json(
      {
        error: 'Internal Server Error',
        info: isProd ? undefined : error,
      },
      { status: 500 },
    )
  }
}
