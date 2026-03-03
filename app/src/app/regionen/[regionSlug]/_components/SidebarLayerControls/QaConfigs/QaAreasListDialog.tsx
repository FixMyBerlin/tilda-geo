import { buttonStyles } from '@/src/app/_components/links/styles'
import { ModalDialog } from '@/src/app/_components/Modal/ModalDialog'
import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import getQaAreasByStatus from '@/src/server/qa-configs/queries/getQaAreasByStatus'
import { useQuery } from '@blitzjs/rpc'
import { CursorArrowRippleIcon } from '@heroicons/react/24/outline'
import { QaEvaluationStatus } from '@prisma/client'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { QaEvaluationCard } from '../../SidebarInspector/InspectorQa/QaEvaluationCard'
import { QA_STYLE_OPTIONS, QaStyleKey } from './qaConfigStyles'

export type QaStyleListConfig =
  | { showList: true; queryUserStatus: QaEvaluationStatus | null }
  | { showList: false; queryUserStatus?: never }

export const qaStyleListConfig: Record<QaStyleKey, QaStyleListConfig> = {
  'user-not-ok-processing': {
    showList: true,
    queryUserStatus: 'NOT_OK_PROCESSING_ERROR',
  },
  'user-not-ok-osm': { showList: true, queryUserStatus: 'NOT_OK_DATA_ERROR' },
  'user-ok-construction': { showList: true, queryUserStatus: 'OK_STRUCTURAL_CHANGE' },
  'user-ok-reference-error': { showList: true, queryUserStatus: 'OK_REFERENCE_ERROR' },
  'user-ok-qa-tooling-error': { showList: true, queryUserStatus: 'OK_QA_TOOLING_ERROR' },
  none: { showList: false },
  all: { showList: false },
  'user-pending': { showList: true, queryUserStatus: null },
  'user-selected': { showList: false },
}

type Props = {
  configSlug: string
  regionSlug: string
  styleKey: QaStyleKey | null
  setClosed: () => void
}

export const QaAreasListDialog = ({ configSlug, regionSlug, styleKey, setClosed }: Props) => {
  const { mainMap } = useMap()

  const listConfig = styleKey ? qaStyleListConfig[styleKey] : null
  const queryUserStatus = listConfig?.queryUserStatus ?? null
  const statusLabel =
    styleKey ? QA_STYLE_OPTIONS.find((o) => o.key === styleKey)?.label ?? 'Unbekannt' : 'Unbekannt'

  const [areas, { isLoading }] = useQuery(
    getQaAreasByStatus,
    {
      configSlug,
      regionSlug,
      userStatus: queryUserStatus,
    },
    { enabled: listConfig?.showList ?? false },
  )

  const handleFlyToArea = (area: NonNullable<typeof areas>[number]) => {
    if (!mainMap || !area.bbox) return
    const [minLng, minLat, maxLng, maxLat] = area.bbox
    mainMap.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 50,
        duration: 1000,
      },
    )

    // Close the dialog
    setClosed()
  }

  if (styleKey === null) return null

  return (
    <ModalDialog
      title={`Liste der letzten 20 Entscheidungen für ${statusLabel}`}
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
                      // NOTE: We will want to move this to teh buttonStyles after our TILDA-Migration
                      'disabled:pointer-events-none disabled:opacity-60 disabled:cursor-default',
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
