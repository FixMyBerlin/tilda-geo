import { isDev } from '@/components/shared/utils/isEnv'
import { geoDataClient } from '@/server/prisma-client.server'

type MetaAsyncColumn = 'qa_update_started_at' | 'qa_update_completed_at'

/**
 * Updates the processing meta table with a timestamp for the QA post-processing step.
 * Uses a guard to ensure we only update recent entries. When QA completes, also sets
 * status to `processed` (the single owner of that transition).
 */
export async function updateProcessingMetaAsync(columnName: MetaAsyncColumn) {
  try {
    const completesRun = columnName === 'qa_update_completed_at'
    const [updatedEntry] = await geoDataClient.$queryRawUnsafe<{ id: number }[]>(`
      UPDATE public.meta
      SET ${columnName} = NOW()${completesRun ? ", status = 'processed'" : ''}
      WHERE id = (
        SELECT id
        FROM public.meta
        WHERE status = 'postprocessing'
          AND processing_completed_at > NOW() - INTERVAL '2 hours'
        ORDER BY id DESC
        LIMIT 1
      )
      RETURNING id
    `)

    if (!updatedEntry) {
      console.warn(
        `[Meta] Warning: No recent postprocessing entry found to update \`${columnName}\``,
      )
      return
    }

    if (isDev) {
      console.log(`[Meta] \`${columnName}\` recorded`)
    }

    if (completesRun) {
      console.log(`[Meta] Processing status set to 'processed' for entry ${updatedEntry.id}`)
    }
  } catch (error) {
    console.error(`Error updating \`${columnName}\`:`, error)
    // Don't throw - this is a background operation
  }
}
