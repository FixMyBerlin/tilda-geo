import { CursorArrowRippleIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { buttonStyles } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { QA_LIST_TAKE_RECENT } from '@/server/qa-configs/listStyleKeys.const'
import { getQaAreasByStatusFn } from '@/server/qa-configs/qa-configs.functions'
import { QaEvaluationCard } from '../../SidebarInspector/InspectorQa/QaEvaluationCard'
import { isListableOption, QA_STYLE_OPTIONS, type QaStyleKey } from './qaConfigStyles'

type Props = {
  configSlug: string
  regionSlug: string
  styleKey: QaStyleKey
  setClosed: () => void
}

export const QaAreasListDialog = ({ configSlug, regionSlug, styleKey, setClosed }: Props) => {
  const { mainMap } = useMap()

  const option = QA_STYLE_OPTIONS.find((o) => o.key === styleKey)
  const statusLabel = option?.label ?? 'Unbekannt'
  const listable = option !== undefined && isListableOption(option)

  const { data: areas, isLoading } = useQuery({
    queryKey: ['qa-configs', 'getQaAreasByStatus', { configSlug, regionSlug, styleKey }],
    queryFn: () =>
      getQaAreasByStatusFn({
        data: { configSlug, regionSlug, styleKey },
      }),
    enabled: listable,
  })

  const handleFlyToArea = (area: NonNullable<typeof areas>[number]) => {
    if (!mainMap || !area.bbox) return
    const [minLng, minLat, maxLng, maxLat] = area.bbox
    mainMap.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 50, duration: 1000 },
    )

    setClosed()
  }

  if (styleKey === 'none' || !listable) return null

  return (
    <ModalDialog
      title={`Liste der letzten ${QA_LIST_TAKE_RECENT} Entscheidungen für ${statusLabel}`}
      icon="info"
      open={true}
      setOpen={setClosed}
      buttonCloseName="Schließen"
    >
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {isLoading && <SmallSpinner />}
        {areas && areas.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Bereiche mit diesem Status gefunden.</p>
        ) : (
          areas?.map((area) => {
            return (
              <div
                key={area.areaId}
                className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-start gap-3">
                  <QaEvaluationCard evaluation={area.latestEvaluation} variant="header" />
                  <button
                    type="button"
                    onClick={() => handleFlyToArea(area)}
                    className={twJoin(
                      buttonStyles,
                      'disabled:pointer-events-none disabled:cursor-default disabled:opacity-60',
                    )}
                    title="Zu diesem Bereich fliegen"
                    disabled={!area.bbox}
                  >
                    <CursorArrowRippleIcon className="size-5" />
                  </button>
                </div>
                {!area.bbox && (
                  <p className="text-xs text-amber-700">
                    Bereich nicht mehr in aktuellen Daten (ID entfernt oder geändert).
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </ModalDialog>
  )
}
