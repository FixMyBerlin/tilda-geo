import { isProd } from '@/src/app/_components/utils/isEnv'
import { StaticRegion, staticRegion } from '@/src/data/regions.const'
import { NextRequest, NextResponse } from 'next/server'
import { styleText } from 'node:util'
import { z } from 'zod'
import { guardEnpoint } from '../_utils/guardEndpoint'
import { warmCache } from './warmCache'

const Schema = z.object({
  apiKey: z.string(),
})

export async function warmRegions(staticRegion: StaticRegion[]) {
  const greenCheckmark = styleText(['bold', 'green'], ' ✓')
  const whiteCircle = styleText(['bold', 'white'], ' ○')
  for (const region of staticRegion) {
    if (region.cacheWarming != undefined && region.bbox != null) {
      const { minZoom, maxZoom, tables } = region.cacheWarming
      console.log(whiteCircle, `Warming cache for ${region.slug} (${minZoom}-${maxZoom})`)
      const startTime = Date.now()
      await warmCache(region.bbox, minZoom, maxZoom, tables)
      const secondsElapsed = Math.round((Date.now() - startTime) / 100) / 10
      console.log(greenCheckmark, `Warmed cache for ${region.slug} in ${secondsElapsed} s`)
    }
  }
}

export async function GET(req: NextRequest) {
  const { access, response } = guardEnpoint(req, Schema)
  if (!access) return response
  try {
    warmRegions(staticRegion)
    return NextResponse.json({ message: 'OK' }, { status: 200 })
  } catch (e) {
    console.error(e)
    if (!isProd) throw e
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
