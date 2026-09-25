import { PlusIcon } from '@heroicons/react/24/outline'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { bbox } from '@turf/turf'
import { useEffect, useEffectEvent } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { RunButton } from '@/components/regionen/pageRegionSlug/Planning/RunButton'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { planningAreasQueryOptions } from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../../hooks/mapState/usePlanningBoundaryState'
import { ModePanel } from '../ModePanel'
import { modePanelHeaderIconButtonClassName, modePanelMutedClassName } from '../modePanel.const'
import { SpaceFinderEditAreaDetail } from './detail/SpaceFinderEditAreaDetail'
import { SpaceFinderNewAreaDetail } from './detail/SpaceFinderNewAreaDetail'
import { SpaceFinderNewVariantDetail } from './detail/SpaceFinderNewVariantDetail'
import { SpaceFinderBody } from './SpaceFinderBody'
import { SpaceFinderCandidateSelectionReset } from './SpaceFinderCandidatesSection'
import {
  firstSpaceFinderVariantId,
  sortedSpaceFinderAreas,
  spaceFinderSelectedVariant,
} from './spaceFinderCollectionOptions'
import { SpaceFinderAreaManageMenu } from './SpaceFinderMenus'
import { SpaceFinderNameModal } from './SpaceFinderNameModal'
import { SpaceFinderSelect } from './SpaceFinderSelect'
import { SpaceFinderVariantTabs } from './SpaceFinderVariantTabs'
import { useSpaceFinderCommands } from './useSpaceFinderCommands'
import { useSpaceFinderModeParam } from './useSpaceFinderModeParam'
import { useSpaceFinderSelection } from './useSpaceFinderSelection'

const routeApi = getRouteApi('/regionen/$regionSlug')

/** D10: mobile shows the mode read-only; editing/creating/running/selection needs a desktop. */
const MobileEditingNotice = () => (
  <p className={twJoin('px-4 py-3', modePanelMutedClassName)}>
    Bearbeitung nur am Desktop verfügbar. Auf dem Smartphone können Sie Planungsgebiete und
    Varianten ansehen sowie berechnete Ergebnisse erkunden.
  </p>
)

/** Empty region (D4): no Planungsgebiet yet, like Prüflisten with zero lists. */
const SpaceFinderEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="flex flex-col gap-3 px-4 py-4" role="status">
    <p className={modePanelMutedClassName}>Noch kein Planungsgebiet in dieser Region.</p>
    <button
      type="button"
      onClick={onCreate}
      className="flex w-fit items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
    >
      <PlusIcon className="size-4" aria-hidden />
      Erstes Planungsgebiet anlegen
    </button>
  </div>
)

/**
 * Flächenfinder mode page (D4/D5/D6): the Planungsgebiete are the header collection (like Ordner
 * in Hinweise), their Varianten a row of pills below the header, then panel body sections
 * instead of a list (status, Planungsgebiet, Faktoren, Ergebnis, Auswahl), and a
 * sticky footer for the primary »Berechnen«/»Neu berechnen« action. Desktop-first (D10) — on
 * mobile the mode is reachable but read-only.
 */
export const PageModeSpaceFinder = () => {
  const { regionSlug } = routeApi.useParams()
  const isDesktop = useBreakpoint('sm')
  const { mainMap: map } = useMap()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const setLastFittedBoundaryKey = usePlanningBoundaryState((s) => s.setLastFittedBoundaryKey)

  // Primed by the route loader (ensureQueryData).
  const { data: areas } = useSuspenseQuery(planningAreasQueryOptions(regionSlug))
  const sortedAreas = sortedSpaceFinderAreas(areas)

  const { spaceFinderMode, setSpaceFinderModeParam } = useSpaceFinderModeParam()
  // Area id and shown run are always derived from the active variant (D7).
  const { variantId: activeVariant, areaId: activeArea, variant } = useSpaceFinderSelection()
  const selectedOption = spaceFinderSelectedVariant(areas, activeVariant)
  const selectedArea = sortedAreas.find((area) => area.id === selectedOption?.areaId)

  const onSelect = (variantId: number | undefined) =>
    setSpaceFinderModeParam({ ...spaceFinderMode, key: variantId })

  // Switching the Gebiet opens its first variant; `ff.key` stays a variant id (D7).
  const onSelectArea = (areaId: number) => {
    const area = sortedAreas.find((a) => a.id === areaId)
    onSelect(area?.variants[0]?.id)
  }

  // `onSelect` is a new function every render. As an effect event it always sees the latest
  // `spaceFinderMode` without being an effect dependency (otherwise `oxlint --fix` in the pre-push
  // hook keeps adding it to the deps array and editors keep removing it again).
  const selectVariant = useEffectEvent((variantId: number | undefined) => onSelect(variantId))

  // Auto-select the first variant of the oldest Gebiet when entering the mode without a
  // selection, or when the URL still points at a deleted (orphaned) variant. Skipped while the
  // create wizard owns the selection (`ff.new`).
  useEffect(
    function selectFirstVariantWhenOrphaned() {
      if (spaceFinderMode.new) return
      if (spaceFinderSelectedVariant(areas, spaceFinderMode.key)) return
      const firstVariantId = firstSpaceFinderVariantId(areas)
      if (firstVariantId === spaceFinderMode.key) return
      selectVariant(firstVariantId)
    },
    [areas, spaceFinderMode],
  )

  const commands = useSpaceFinderCommands({ regionSlug, areas, selectedOption, onSelect })

  const studyArea = variant?.area.studyArea as GeoJSON.Geometry | undefined
  const creatingOrEditingArea = spaceFinderMode.new === 'area' || spaceFinderMode.edit === 'area'

  // Outline lives on the page (not the body) so it stays on the map while switching variants of
  // the same planungsgebiet, and while a detail view replaces the body.
  useEffect(
    function syncStudyAreaOutline() {
      // While creating/editing the Gebiet, the wizard/editor's own form fields own the highlight.
      if (creatingOrEditingArea) return
      if (activeArea == null) {
        setBoundaryHighlightGeom(null)
        return
      }
      if (!studyArea) return
      setBoundaryHighlightGeom(studyArea, { filled: false })
      if (map) {
        const [minLng, minLat, maxLng, maxLat] = bbox({
          type: 'Feature',
          geometry: studyArea,
          properties: {},
        })
        const boundaryKey = [minLng, minLat, maxLng, maxLat].map((v) => v.toFixed(6)).join(',')
        if (usePlanningBoundaryState.getState().lastFittedBoundaryKey !== boundaryKey) {
          setLastFittedBoundaryKey(boundaryKey)
          map.fitBounds([minLng, minLat, maxLng, maxLat], { padding: 60, duration: 800 })
        }
      }
    },
    [
      creatingOrEditingArea,
      activeArea,
      studyArea,
      map,
      setBoundaryHighlightGeom,
      setLastFittedBoundaryKey,
    ],
  )

  // Clear the outline when leaving the mode — the component unmounts with the route.
  useEffect(() => () => setBoundaryHighlightGeom(null), [setBoundaryHighlightGeom])

  const closeNew = () => setSpaceFinderModeParam({ ...spaceFinderMode, new: undefined })
  const closeEdit = () => setSpaceFinderModeParam({ ...spaceFinderMode, edit: undefined })

  // Detail views are desktop-only (D10) — create/edit affordances that open them are already
  // hidden there, but guard here too in case a bookmark still carries `ff.new`/`ff.edit`.
  const newAreaDetail =
    isDesktop && spaceFinderMode.new === 'area'
      ? {
          title: 'Neues Planungsgebiet',
          onBack: closeNew,
          children: <SpaceFinderNewAreaDetail regionSlug={regionSlug} />,
        }
      : undefined
  const newVariantDetail =
    isDesktop && spaceFinderMode.new === 'variant' && selectedOption
      ? {
          title: 'Neue Variante',
          subtitle: `Planungsgebiet ${frenchQuote(selectedOption.areaTitle)}`,
          onBack: closeNew,
          children: (
            <SpaceFinderNewVariantDetail
              areaId={selectedOption.areaId}
              areaTitle={selectedOption.areaTitle}
              regionSlug={regionSlug}
            />
          ),
        }
      : undefined
  const editAreaDetail =
    isDesktop && spaceFinderMode.edit === 'area' && activeArea != null
      ? {
          title: 'Planungsgebiet bearbeiten',
          onBack: closeEdit,
          children: <SpaceFinderEditAreaDetail areaId={activeArea} regionSlug={regionSlug} />,
        }
      : undefined
  const panelDetail = newAreaDetail ?? newVariantDetail ?? editAreaDetail

  // Header ➕/⋯ menus: hidden in a detail view and on mobile (D10 — creating/editing needs desktop).
  const openNewArea = () => setSpaceFinderModeParam({ ...spaceFinderMode, new: 'area' })

  // Header actions belong to the Planungsgebiet (the collection); variant actions live in the
  // Varianten row. Without any Gebiet, ➕ creates the first one — like Prüflisten with zero lists.
  const showHeaderActions = !panelDetail && isDesktop
  const actions = !showHeaderActions ? undefined : selectedOption ? (
    <SpaceFinderAreaManageMenu
      selected={selectedOption}
      onEditArea={() => setSpaceFinderModeParam({ ...spaceFinderMode, edit: 'area' })}
      commands={commands}
    />
  ) : sortedAreas.length === 0 ? (
    <Tooltip text="Neues Planungsgebiet">
      <button
        type="button"
        onClick={openNewArea}
        aria-label="Neues Planungsgebiet"
        className={modePanelHeaderIconButtonClassName}
      >
        <PlusIcon className="size-5" aria-hidden />
      </button>
    </Tooltip>
  ) : undefined

  const variantTabs =
    !panelDetail && selectedOption && selectedArea ? (
      <SpaceFinderVariantTabs
        variants={selectedArea.variants}
        selected={selectedOption}
        onSelect={onSelect}
        editable={isDesktop}
        onNewVariant={() => setSpaceFinderModeParam({ ...spaceFinderMode, new: 'variant' })}
        commands={commands}
      />
    ) : undefined

  // Sticky footer: hidden in a detail view and on mobile (D10 — running needs desktop).
  const footer =
    !panelDetail && isDesktop && activeVariant != null && variant != null ? (
      <RunButton
        variantId={activeVariant}
        regionSlug={regionSlug}
        latestJob={variant.jobs[0] ?? null}
        showJobStatus={false}
      />
    ) : undefined

  return (
    <ModePanel
      title={
        selectedOption ? `Planungsgebiet ${frenchQuote(selectedOption.areaTitle)}` : 'Flächenfinder'
      }
      detail={panelDetail}
      collectionAlwaysOpen={sortedAreas.length === 0}
      collection={
        <SpaceFinderSelect
          areas={sortedAreas}
          selectedAreaId={selectedOption?.areaId}
          onSelectArea={onSelectArea}
          onNewArea={isDesktop ? openNewArea : undefined}
        />
      }
      actions={actions}
      filter={variantTabs}
      footer={footer}
    >
      <SpaceFinderCandidateSelectionReset />
      {activeVariant != null ? (
        <SpaceFinderBody regionSlug={regionSlug} variantId={activeVariant} editable={isDesktop} />
      ) : sortedAreas.length === 0 ? (
        isDesktop ? (
          <SpaceFinderEmptyState onCreate={openNewArea} />
        ) : (
          <p className={twJoin('px-4 py-3', modePanelMutedClassName)}>
            Noch kein Planungsgebiet in dieser Region.
          </p>
        )
      ) : (
        <p className={twJoin('px-4 py-3', modePanelMutedClassName)}>
          Wählen Sie ein Planungsgebiet.
        </p>
      )}
      {!isDesktop && <MobileEditingNotice />}
      {selectedOption && (
        <SpaceFinderNameModal
          kind={commands.nameModal}
          defaultName={
            commands.nameModal === 'renameArea'
              ? selectedOption.areaTitle
              : commands.nameModal === 'renameVariant'
                ? selectedOption.variantTitle
                : ''
          }
          isPending={commands.renameVariant.isPending || commands.renameArea.isPending}
          onClose={commands.closeNameModal}
          onSubmit={async (name) => {
            if (commands.nameModal === 'renameArea') {
              await commands.renameArea.mutateAsync(name)
              return
            }
            await commands.renameVariant.mutateAsync(name)
          }}
        />
      )}
    </ModePanel>
  )
}
