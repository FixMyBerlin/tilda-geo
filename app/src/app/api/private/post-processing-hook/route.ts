import { isProd } from '@/src/app/_components/utils/isEnv'
import { registerSQLFunctions } from '@/src/server/instrumentation/registerSQLFunctions'
import { analysis } from '@/src/server/statistics/analysis/analysis'
import { updateProcessingMetaAsync } from '@/src/server/statistics/analysis/updateProcessingStatus'
import { NextRequest, NextResponse } from 'next/server'
import { guardEnpoint, GuardEnpointSchema } from '../_utils/guardEndpoint'

async function runStatistics() {
  try {
    // Record start time in database
    await updateProcessingMetaAsync('statistics_started_at')

    await registerSQLFunctions()
    await analysis()

    // Record completion time in database
    await updateProcessingMetaAsync('statistics_completed_at')
  } catch (e) {
    console.error('Statistics: Error', e)
    if (!isProd) throw e
  }
}

export async function GET(request: NextRequest) {
  const { access, response } = guardEnpoint(request, GuardEnpointSchema)
  if (!access) return response

  // Fire and forget - don't await
  runStatistics().catch((error) => {
    console.error('Statistics: Unhandled error in background task', error)
  })

  return NextResponse.json({ message: 'TRIGGERED' }, { status: 200 })
}
