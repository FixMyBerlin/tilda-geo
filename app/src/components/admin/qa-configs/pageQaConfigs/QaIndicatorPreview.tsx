import { useMutation } from '@tanstack/react-query'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { toastError } from '@/components/shared/toast/toastError'
import { formatNumber, formatPercentage } from '@/components/shared/utils/formatNumber'
import { previewQaIndicatorThresholdsFn } from '@/server/qa-configs/qa-configs.functions'
import {
  type QaIndicatorDraft,
  qaIndicatorDraftThresholdsSchema,
} from '@/server/qa-configs/schemas'

type Props = {
  draft: QaIndicatorDraft
  unit: string
  configId: number | undefined
}

/**
 * "Mit aktuellen Daten prüfen": how the latest processing run's cells would be rated with the
 * thresholds typed into this indicator (saved or not), plus the largest differences.
 */
export function QaIndicatorPreview({ draft, unit, configId }: Props) {
  const thresholds = qaIndicatorDraftThresholdsSchema.safeParse(draft)
  const previewMutation = useMutation({
    mutationFn: () => {
      if (!configId || !thresholds.success) throw new Error('Konfiguration oder Werte fehlen')
      return previewQaIndicatorThresholdsFn({
        data: { configId, indicatorKey: draft.key, thresholds: thresholds.data },
      })
    },
    onError: (error) => toastError(error, 'Vorschau konnte nicht geladen werden'),
  })
  const preview = previewMutation.data

  return (
    <div className="space-y-2 text-sm">
      <button
        type="button"
        className={buttonStylesSecondary}
        disabled={!configId || !draft.key || !thresholds.success || previewMutation.isPending}
        title={configId ? undefined : 'Erst nach dem ersten Speichern verfügbar'}
        onClick={() => previewMutation.mutate()}
      >
        {previewMutation.isPending ? '…' : 'Mit aktuellen Daten prüfen'}
      </button>

      {preview && preview.topDifferences.length === 0 ? (
        <p className="text-gray-500">
          Noch keine Werte: der Indikator wurde noch nicht verarbeitet oder hat keine Referenz.
        </p>
      ) : null}
      {preview && preview.topDifferences.length > 0 ? (
        <div className="space-y-2 rounded-md border border-gray-200 p-3">
          <p>
            <span className="font-semibold text-green-700">{preview.good} gut</span> ·{' '}
            <span className="font-semibold text-yellow-700">{preview.needsReview} prüfen</span> ·{' '}
            <span className="font-semibold text-red-700">{preview.problematic} problematisch</span>
            {preview.trustedEditorChange > 0 ? (
              <> · {preview.trustedEditorChange} gut (Vertrauensliste)</>
            ) : null}
          </p>
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pr-3">Fläche</th>
                <th className="pr-3">Referenz</th>
                <th className="pr-3">Aktuell</th>
                <th className="pr-3">Differenz ({unit})</th>
                <th>Abweichung</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {preview.topDifferences.map((row) => (
                <tr key={row.areaId} className="border-t border-gray-100">
                  <td className="pr-3 text-gray-800">{row.areaId}</td>
                  <td className="pr-3">{formatNumber(row.reference)}</td>
                  <td className="pr-3">{formatNumber(row.current)}</td>
                  <td className="pr-3">{formatNumber(row.difference)}</td>
                  <td>{formatPercentage(row.deviation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
