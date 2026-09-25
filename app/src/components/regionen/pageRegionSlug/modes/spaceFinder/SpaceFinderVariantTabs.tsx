import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { Spinner } from '../../Planning/Spinner'
import { modeIdentity } from '../modeIdentity'
import { modePanelFilterControlClassName } from '../modePanel.const'
import {
  type PlanningAreaVariantRow,
  type SpaceFinderSelectedVariant,
  type SpaceFinderVariantStatus,
  spaceFinderVariantStatus,
} from './spaceFinderCollectionOptions'
import { SpaceFinderVariantManageMenu, SpaceFinderVariantNewMenu } from './SpaceFinderMenus'
import type { SpaceFinderCommands } from './useSpaceFinderCommands'

const statusText = {
  running: 'Berechnung läuft',
  stale: 'Ergebnis veraltet',
  complete: 'Berechnet',
  none: 'Noch nicht berechnet',
} satisfies Record<SpaceFinderVariantStatus, string>

const StatusIcon = ({ status, active }: { status: SpaceFinderVariantStatus; active: boolean }) => {
  switch (status) {
    case 'running':
      return (
        <Spinner
          label={statusText.running}
          className={twJoin('size-3', active ? 'border-white' : 'border-emerald-700')}
        />
      )
    case 'stale':
      return (
        <ExclamationTriangleIcon
          className={twJoin('size-3.5 shrink-0', active ? 'text-amber-200' : 'text-amber-600')}
          aria-hidden
        />
      )
    case 'complete':
      return (
        <CheckIcon
          className={twJoin('size-3.5 shrink-0', active ? 'text-white' : 'text-emerald-700')}
          aria-hidden
        />
      )
    case 'none':
      return (
        <span
          className={twJoin(
            'size-2.5 shrink-0 rounded-full border',
            active ? 'border-white/80' : 'border-gray-400',
          )}
          aria-hidden
        />
      )
  }
}

type Props = {
  variants: PlanningAreaVariantRow[]
  selected: SpaceFinderSelectedVariant
  onSelect: (variantId: number) => void
  /** Desktop only (D10): ➕/⋯ for creating, renaming, duplicating and deleting variants. */
  editable: boolean
  onNewVariant: () => void
  commands: SpaceFinderCommands
}

/**
 * Second level below the Planungsgebiet collection: all variants of the Gebiet side by side as
 * pills, with their run state, so switching and comparing needs one click and no dropdown.
 * Variant names are mostly generated (»Variante 2«, »… (Kopie)«), so pills truncate long names
 * and show the full name in the tooltip. The ➕/⋯ act on variants only; the Gebiet has its own
 * menu in the panel header.
 */
export const SpaceFinderVariantTabs = ({
  variants,
  selected,
  onSelect,
  editable,
  onNewVariant,
  commands,
}: Props) => {
  const { accent } = modeIdentity.spaceFinder

  return (
    <div className="flex items-start gap-2">
      <div role="tablist" aria-label="Varianten" className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {variants.map((variant) => {
          const active = variant.id === selected.variantId
          const status = spaceFinderVariantStatus(variant)
          return (
            <Tooltip key={variant.id} text={`${variant.title} — ${statusText[status]}`}>
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  if (!active) onSelect(variant.id)
                }}
                className={twJoin(
                  modePanelFilterControlClassName,
                  'h-7 max-w-44 cursor-pointer gap-1.5',
                  active &&
                    twJoin(
                      accent.className,
                      accent.invertedFgClassName,
                      'border-transparent font-medium hover:bg-emerald-800',
                    ),
                )}
              >
                <StatusIcon status={status} active={active} />
                <span className="truncate">{variant.title}</span>
              </button>
            </Tooltip>
          )
        })}
      </div>
      {editable ? (
        <div className="flex shrink-0 gap-1">
          <SpaceFinderVariantNewMenu
            selected={selected}
            onNewVariant={onNewVariant}
            commands={commands}
          />
          <SpaceFinderVariantManageMenu selected={selected} commands={commands} />
        </div>
      ) : null}
    </div>
  )
}
