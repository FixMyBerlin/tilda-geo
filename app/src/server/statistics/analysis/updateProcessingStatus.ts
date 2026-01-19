import { isDev } from '@/src/app/_components/utils/isEnv'
import { geoDataClient } from '@/src/server/prisma-client'

/**
 * Updates the processing meta table with a timestamp for an async operation.
 * Uses guard to ensure we only update recent entries.
 * Checks if both async operations are complete and updates status to `processed` if so.
 */
export async function updateProcessingMetaAsync(
  columnName:
    | 'qa_update_started_at'
    | 'statistics_started_at'
    | 'qa_update_completed_at'
    | 'statistics_completed_at',
) {
  try {
    type Query = Array<{
      id: number
      qa_update_started_at: Date | null
      qa_update_completed_at: Date | null
      statistics_started_at: Date | null
      statistics_completed_at: Date | null
      processing_completed_at: Date
    }>
    const [updatedEntry] = await geoDataClient.$queryRawUnsafe<Query>(`
      UPDATE public.meta
      SET ${columnName} = NOW()
      WHERE id = (
        SELECT id
        FROM public.meta
        WHERE status = 'postprocessing'
          AND processing_completed_at > NOW() - INTERVAL '2 hours'
        ORDER BY id DESC
        LIMIT 1
      )
      RETURNING id, qa_update_started_at, qa_update_completed_at, statistics_started_at, statistics_completed_at, processing_completed_at
    `)

    if (!updatedEntry) {
      console.warn(`[Meta] Warning: No recent postprocessing entry found to update \`${columnName}\``)
    } else {
      if (isDev) {
        console.log(`[Meta] \`${columnName}\` recorded`)
      }

      // Check if both async operations are complete and update status inline
      const bothCompleted =
        updatedEntry.qa_update_completed_at !== null &&
        updatedEntry.statistics_completed_at !== null

      // Also check timeout: if both started but not completed, and it's been more than 2 hours since main processing completed
      const bothStarted =
        updatedEntry.qa_update_started_at !== null && updatedEntry.statistics_started_at !== null

      const timeoutReached =
        bothStarted &&
        !bothCompleted &&
        new Date(updatedEntry.processing_completed_at).getTime() < Date.now() - 2 * 60 * 60 * 1000

      if (bothCompleted || timeoutReached) {
        await geoDataClient.$executeRaw`
          UPDATE public.meta
          SET status = 'processed'
          WHERE id = ${updatedEntry.id}
        `
        if (timeoutReached) {
          console.log(
            `[Meta] Processing status updated to 'processed' for entry ${updatedEntry.id} (timeout - operations started but not completed)`,
          )
        } else {
          console.log(`[Meta] Processing status updated to 'processed' for entry ${updatedEntry.id}`)
        }
      }
    }
  } catch (error) {
    console.error(`Error updating \`${columnName}\`:`, error)
    // Don't throw - this is a background operation
  }
}
