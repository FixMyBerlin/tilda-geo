import { useQuery } from '@tanstack/react-query'
import { useMap } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { qaSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import { mergeModeUrlFeature } from '@/components/regionen/pageRegionSlug/Map/utils/partitionClickedFeatures'
import {
  evaluatorTypeConfig,
  systemStatusConfig,
  userStatusConfig,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { getQaAreaListFn } from '@/server/qa-configs/qa-configs.functions'
import type { QaAreaListItem } from '@/server/qa-configs/queries/getQaAreaList.server'
import { qaEvalDraftId } from '../composerDrafts/composerDraftIds'
import { ComposerDraftDot } from '../composerDrafts/DraftIndicatorDot'
import { flyMapToIfOffscreen } from '../flyMapToIfOffscreen'
import { modeListFilterEmptyMessage } from '../modeListFilterEmptyMessage'
import { ModeListItem } from '../ModeListItem'
import { qaListItemId } from '../modeListItemId'
import {
  modePanelListHintClassName,
  modePanelListMetaClassName,
  modePanelListTitleClassName,
  modePanelMutedClassName,
} from '../modePanel.const'
import { ModePanelEmpty } from '../ModePanelEmpty'
import { ModeCommentsPill, ModePanelPill } from '../ModePanelPill'
import type { ModeListExtent } from '../useMapExtentFilter'
import { useMapViewportBbox } from '../useMapViewportBbox'
import { QA_STATUS_SELECT_ALL, type QaStatusKey } from './qaConfigStyles'
import { QaZoomNotice } from './QaZoomNotice'

const evaluatorLabel = (area: QaAreaListItem) => {
  if (area.evaluatorType === 'SYSTEM') return 'System-Bewertung'
  const displayName = [area.authorFirstName, area.authorLastName].filter(Boolean).join(' ')
  const parts = [displayName || null, area.authorOsmName].filter(Boolean)
  return parts.join(' ') || evaluatorTypeConfig.USER.label
}

type Props = {
  configSlug: string
  regionSlug: string
  status: QaStatusKey | typeof QA_STATUS_SELECT_ALL
  users?: string[]
  search: string
  extent: ModeListExtent
}

/**
 * QA mode area rows. Filters (status, users, search, map extent) run on the server.
 * Clicking an area selects it in `f` (mode panel detail) and pans if it is off-screen.
 */
export const QaModeAreaList = ({
  configSlug,
  regionSlug,
  status,
  users,
  search,
  extent,
}: Props) => {
  const { mainMap } = useMap()
  const { featuresParam, setFeaturesParam } = useFeaturesParam()
  const viewportBbox = useMapViewportBbox()
  const bbox = extent === 'view' ? viewportBbox : undefined
  const queryEnabled = Boolean(configSlug) && (extent === 'all' || bbox !== undefined)

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'qa-configs',
      'getQaAreaList',
      { configSlug, regionSlug, status, users, search, extent, bbox },
    ],
    queryFn: () =>
      getQaAreaListFn({
        data: {
          configSlug,
          regionSlug,
          status,
          userIds: users,
          search: search || undefined,
          bbox,
        },
      }),
    enabled: queryEnabled,
  })

  if (!queryEnabled || isLoading) {
    return (
      <>
        <QaZoomNotice />
        <div className={`flex items-center gap-2 px-4 py-3 ${modePanelMutedClassName}`}>
          <SmallSpinner /> Lädt…
        </div>
      </>
    )
  }

  if (isError) {
    return (
      <>
        <QaZoomNotice />
        <p className={`px-4 py-3 ${modePanelMutedClassName}`}>
          Bereiche konnten nicht geladen werden.
        </p>
      </>
    )
  }

  const areas = data?.items ?? []
  const totalCount = data?.totalCount ?? 0

  const activeIds = new Set(
    featuresParam
      .filter((feature) => feature.sourceId === qaSourceId)
      .map((feature) => String(feature.id)),
  )

  if (areas.length === 0) {
    return (
      <>
        <QaZoomNotice />
        <ModePanelEmpty
          label="Keine Bereiche für diese Filter."
          description={modeListFilterEmptyMessage({
            itemLabel: 'Bereiche',
            extentIsView: extent === 'view',
          })}
        />
      </>
    )
  }

  const shown = areas.length.toLocaleString('de-DE')
  const total = totalCount.toLocaleString('de-DE')
  const truncationHint =
    totalCount > areas.length
      ? extent === 'view'
        ? `Es werden ${shown} von ${total} Bereichen angezeigt. Zoome näher heran, um die Liste zu verkleinern.`
        : `Es werden ${shown} von ${total} Bereichen angezeigt. Wechsle auf ${frenchQuote('Kartenausschnitt')}, um nur den sichtbaren Ausschnitt zu listen.`
      : null

  return (
    <>
      <QaZoomNotice />
      {truncationHint ? (
        <p className={`px-4 py-2 ${modePanelListHintClassName}`}>{truncationHint}</p>
      ) : null}
      <ul>
        {areas.map((area) => {
          const userConfig = area.userStatus ? userStatusConfig[area.userStatus] : null
          const config = userConfig ?? systemStatusConfig[area.systemStatus]
          return (
            <ModeListItem
              key={area.areaId}
              id={qaListItemId(area.areaId)}
              coordinates={area.center}
              active={activeIds.has(area.areaId)}
              onClick={() => {
                setFeaturesParam(
                  mergeModeUrlFeature(featuresParam, {
                    id: area.areaId,
                    sourceId: qaSourceId,
                    coordinates: area.bbox,
                  }),
                )
                flyMapToIfOffscreen(mainMap, area.bbox)
              }}
            >
              <div className="relative flex items-start justify-between gap-2">
                <span className={modePanelListTitleClassName}>Bereich #{area.areaId}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <ModeCommentsPill count={area.commentCount} />
                  <TimeWithRelativeTooltip
                    date={area.createdAt}
                    timeClassName={modePanelListHintClassName}
                  />
                </span>
                <ComposerDraftDot draftId={qaEvalDraftId(regionSlug, configSlug, area.areaId)} />
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <ModePanelPill backgroundColor={config.hexColor}>{config.label}</ModePanelPill>
                <span className={`truncate ${modePanelListMetaClassName}`}>
                  {evaluatorLabel(area)}
                </span>
              </div>
            </ModeListItem>
          )
        })}
      </ul>
    </>
  )
}
