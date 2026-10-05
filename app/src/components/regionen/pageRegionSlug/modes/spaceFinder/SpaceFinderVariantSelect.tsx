import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { ModeCollectionNewRow } from '../ModeCollectionNewRow'
import { ModeCollectionSelect } from '../ModeCollectionSelect'
import { modeIdentity } from '../modeIdentity'
import { ModePanelCollectionDisclosure } from '../ModePanelCollectionDisclosure'
import {
  type PlanningAreaVariantRow,
  type SpaceFinderSelectedVariant,
  type SpaceFinderVariantStatus,
  spaceFinderVariantStatus,
} from './spaceFinderCollectionOptions'
import { SpaceFinderVariantManageMenu } from './SpaceFinderMenus'
import type { SpaceFinderCommands } from './useSpaceFinderCommands'

const statusText = {
  running: 'Berechnung läuft',
  stale: 'Ergebnis veraltet',
  complete: 'Berechnet',
  none: 'Noch nicht berechnet',
} satisfies Record<SpaceFinderVariantStatus, string>

/** Run state of the active variant in the bar's icon slot (where the panel header has the mode icon). */
const StatusIcon = ({ status }: { status: SpaceFinderVariantStatus }) => {
  switch (status) {
    case 'running':
      return <Spinner size="4" color="white" label={statusText.running} />
    case 'stale':
      return <ExclamationTriangleIcon className="size-5 shrink-0 text-amber-200" aria-hidden />
    case 'complete':
      return <CheckIcon className="size-5 shrink-0 text-white" aria-hidden />
    case 'none':
      return (
        <span className="mx-1 size-3 shrink-0 rounded-full border border-white/80" aria-hidden />
      )
  }
}

type Props = {
  variants: PlanningAreaVariantRow[]
  selected: SpaceFinderSelectedVariant
  onSelect: (variantId: number) => void
  /** Desktop only (D10): creating, duplicating, renaming and deleting variants. */
  editable: boolean
  onNewVariant: () => void
  commands: SpaceFinderCommands
}

/**
 * Second level directly below the Planungsgebiet header: the Gebiet's Varianten as a dropdown that
 * looks and works like the Planungsgebiet one (same bar, same option list, trailing »Neu…« row),
 * in a lighter green so the two levels stay distinguishable. The ⋯ acts on the active variant
 * (duplicate, rename, delete); the Gebiet keeps its own menu in the panel header.
 */
export const SpaceFinderVariantSelect = ({
  variants,
  selected,
  onSelect,
  editable,
  onNewVariant,
  commands,
}: Props) => {
  const { accent } = modeIdentity.spaceFinder
  const activeVariant = variants.find((variant) => variant.id === selected.variantId)
  const activeStatus = activeVariant ? spaceFinderVariantStatus(activeVariant) : 'none'

  return (
    <div className="border-b border-white/80 bg-emerald-600 text-white">
      <ModePanelCollectionDisclosure
        icon={<StatusIcon status={activeStatus} />}
        title={`Variante ${frenchQuote(selected.variantTitle)}`}
        subtitle={statusText[activeStatus]}
        mutedClassName={accent.invertedMutedClassName}
        headingLevel="h2"
        actions={
          editable ? (
            <SpaceFinderVariantManageMenu selected={selected} commands={commands} />
          ) : undefined
        }
        collection={
          <div className="flex flex-col gap-1">
            <ModeCollectionSelect
              aria-label="Variante"
              value={String(selected.variantId)}
              options={variants.map((variant) => ({
                value: String(variant.id),
                label: variant.title,
                description: statusText[spaceFinderVariantStatus(variant)],
              }))}
              onChange={(next) => onSelect(Number(next))}
            />
            {editable ? (
              <ModeCollectionNewRow onClick={onNewVariant}>
                Neue Variante mit Standardwerten…
              </ModeCollectionNewRow>
            ) : null}
          </div>
        }
      />
    </div>
  )
}
