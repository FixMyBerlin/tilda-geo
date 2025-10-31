import { buttonStyles } from '@/src/app/_components/links/styles'
import { ModalDialog } from '@/src/app/_components/Modal/ModalDialog'
import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import getQaAreasByStatus from '@/src/server/qa-configs/queries/getQaAreasByStatus'
import { useQuery } from '@blitzjs/rpc'
import { CursorArrowRippleIcon } from '@heroicons/react/24/outline'
import { QaEvaluationStatus } from '@prisma/client'
import { useMap } from 'react-map-gl/maplibre'
import { userStatusConfig } from '../../SidebarInspector/InspectorQa/qaConfigs'
import { QaEvaluationCard } from '../../SidebarInspector/InspectorQa/QaEvaluationCard'
import { QaStyleKey } from './qaConfigStyles'

type Props = {
  configSlug: string
  regionSlug: string
  styleKey: QaStyleKey | null
  setClosed: () => void
}

// Map style keys to QA evaluation statuses
export const qaAreasStatusMap: Record<QaStyleKey, QaEvaluationStatus | null> = {
  'user-not-ok-processing': 'NOT_OK_PROCESSING_ERROR',
  'user-not-ok-osm': 'NOT_OK_DATA_ERROR',
  'user-ok-construction': 'OK_STRUCTURAL_CHANGE',
  'user-ok-reference-error': 'OK_REFERENCE_ERROR',
  'user-other': 'OTHER',
  none: null,
  all: null,
  'user-pending': null,
}

export const QaAreasListDialog = ({ configSlug, regionSlug, styleKey, setClosed }: Props) => {
  const { mainMap } = useMap()

  const userStatus = styleKey ? qaAreasStatusMap[styleKey] : null
  const statusLabel = userStatus ? userStatusConfig[userStatus]?.label || userStatus : 'Unbekannt'

  const [areas, { isLoading }] = useQuery(
    getQaAreasByStatus,
    {
      configSlug,
      regionSlug,
      userStatus: userStatus!,
    },
    { enabled: userStatus !== null },
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
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
              >
                {/* Evaluation Card Content */}
                <QaEvaluationCard evaluation={area.latestEvaluation} variant="header" />

                {/* Fly to button */}
                <button
                  onClick={() => handleFlyToArea(area)}
                  className={buttonStyles}
                  title="Zu diesem Bereich fliegen"
                >
                  <CursorArrowRippleIcon className="h-5 w-5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </ModalDialog>
  )
}
