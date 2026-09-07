import { CheckBadgeIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import { CheckBadgeIcon as CheckBadgeIconOutline } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'

export const PRIVATE_DATASET_TITLE =
  'Datensatz nur für angemeldete Nutzer:innen mit Rechten für die Region sichtbar.'

export const ACTIVE_COLLECTION_TITLE = 'Aktive Konfiguration'
export const INACTIVE_COLLECTION_TITLE = 'Inaktive Konfiguration'

type ModeCollectionOption = {
  value: string
  label: string
  /** Secondary text in the menu (e.g. entry count). */
  description?: string
  private?: boolean
  /** QA configs: filled vs outline check-badge. Omit when status does not apply. */
  inactive?: boolean
}

type Props = {
  value: string
  options: ModeCollectionOption[]
  onChange?: (value: string) => void
  /** Openable so the lock is visible, but the selection cannot change (Hinweise). */
  readOnly?: boolean
  'aria-label'?: string
}

/**
 * Collection options for the mode header disclosure. Selection lives in the panel title
 * (`Liste »…«`); this list pushes the filter/list down when the header is open.
 */
export const ModeCollectionSelect = ({
  value,
  options,
  onChange,
  readOnly = false,
  'aria-label': ariaLabel = 'Sammlung wählen',
}: Props) => {
  const selected = options.find((option) => option.value === value) ?? options[0]
  if (!selected) return null

  return (
    <div role="listbox" aria-label={ariaLabel} className="flex flex-col gap-0.5">
      {options.map((option) => {
        const isSelected = option.value === selected.value
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={readOnly && !isSelected}
            onClick={() => {
              if (readOnly || option.value === selected.value) return
              onChange?.(option.value)
            }}
            className={twJoin(
              'flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm select-none',
              isSelected
                ? 'bg-white/20 font-medium text-white'
                : 'text-white/90 hover:bg-white/10 focus-visible:bg-white/10 active:bg-white/10',
              option.inactive && !isSelected ? 'text-white/70' : '',
              readOnly ? 'cursor-default' : '',
            )}
          >
            {option.inactive !== undefined ? (
              option.inactive ? (
                <CheckBadgeIconOutline
                  className="size-4 flex-none text-white/50"
                  title={INACTIVE_COLLECTION_TITLE}
                />
              ) : (
                <CheckBadgeIcon
                  className="size-4 flex-none text-white/90"
                  title={ACTIVE_COLLECTION_TITLE}
                />
              )
            ) : null}
            <span className="min-w-0 flex-1 truncate">
              {option.label}
              {option.description ? (
                <span className="font-normal text-white/70"> · {option.description}</span>
              ) : null}
            </span>
            {option.private ? (
              <LockClosedIcon
                className="size-4 flex-none text-white/60"
                title={PRIVATE_DATASET_TITLE}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
