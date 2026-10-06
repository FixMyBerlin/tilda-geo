import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { useStore } from '@tanstack/react-form'
import type { MouseEvent, ReactNode } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { adminAsideIconButtonClassName } from '@/components/admin/adminClasses'
import type { FormApi } from '@/components/shared/form/types'
import { Link } from '@/components/shared/links/Link'
import { buttonStyles } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { type AdminLinkTarget, AdminAsideActions } from './AdminAsideActions'
import { scrollToFirstInvalidAdminSection, useAdminAsideVariant } from './adminAsideSection'

type Props<TValues> = {
  form: FormApi<TValues>
  /** “Erstellen” on new pages, “Speichern” on edit pages. */
  submitLabel: string
  /** “Abbrechen” target — the parent list. Asks before discarding unsaved changes. */
  cancel: AdminLinkTarget
  /** From `Form`’s render state (`actionBarPlacement="none"`). */
  submitError?: string | null
  /** `AdminAsideLink`s. */
  secondary?: ReactNode
  /** `AdminDeleteButton` (edit pages only). */
  destructive?: ReactNode
}

/** Plain (borderless) desktop “Abbrechen” below the primary submit. */
const cancelClassName = twJoin(
  'inline-flex w-full items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-gray-600 no-underline',
  'hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500',
)

/** Aside actions for a `Form` with `actionBarPlacement="none"`; must render inside the `<form>`. */
export function AdminFormAsideActions<TValues>({
  form,
  submitLabel,
  cancel,
  submitError,
  secondary,
  destructive,
}: Props<TValues>) {
  const variant = useAdminAsideVariant()
  const { hasChanges, isSubmitting, invalidFieldCount } = useStore(form.store, (state) => ({
    hasChanges: !state.isDefaultValue,
    isSubmitting: state.isSubmitting,
    invalidFieldCount:
      state.submissionAttempts > 0
        ? Object.values(state.fieldMeta).filter(
            (meta) => ((meta as { errors?: unknown[] } | undefined)?.errors?.length ?? 0) > 0,
          ).length
        : 0,
  }))
  const invalidLabel =
    invalidFieldCount === 1 ? '1 Feld prüfen' : `${invalidFieldCount} Felder prüfen`

  // Keeps a real link (middle-click, href); only blocks the router navigation when the user declines.
  const confirmCancel = (event: MouseEvent) => {
    if (hasChanges && !window.confirm('Ungespeicherte Änderungen verwerfen?')) {
      event.preventDefault()
    }
  }

  if (variant !== 'desktop') {
    return (
      <AdminAsideActions
        status={
          invalidFieldCount > 0 ? (
            <button
              type="button"
              onClick={scrollToFirstInvalidAdminSection}
              className={twMerge(adminAsideIconButtonClassName, 'w-auto gap-x-1 px-2 text-red-700')}
            >
              <ExclamationCircleIcon aria-hidden="true" className="size-5" />
              {invalidFieldCount}
              <span className="sr-only">{invalidLabel}</span>
            </button>
          ) : null
        }
        primary={
          <>
            <button
              type="submit"
              disabled={isSubmitting}
              className={twMerge(buttonStyles, 'gap-x-2 px-3')}
            >
              {isSubmitting ? <SmallSpinner /> : null}
              {submitLabel}
              {hasChanges && !isSubmitting ? (
                <span className="size-2 rounded-full bg-yellow-600">
                  <span className="sr-only">(ungespeicherte Änderungen)</span>
                </span>
              ) : null}
            </button>
            <Link
              {...cancel}
              onClick={confirmCancel}
              classNameOverwrite={adminAsideIconButtonClassName}
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
              <span className="sr-only">Abbrechen</span>
            </Link>
          </>
        }
        secondary={secondary}
        destructive={destructive}
      />
    )
  }

  return (
    <AdminAsideActions
      primary={
        <>
          <button
            type="submit"
            disabled={isSubmitting}
            className={twJoin(buttonStyles, 'w-full gap-x-2')}
          >
            {isSubmitting ? <SmallSpinner /> : null}
            {submitLabel}
          </button>
          <Link {...cancel} onClick={confirmCancel} classNameOverwrite={cancelClassName}>
            Abbrechen
          </Link>
        </>
      }
      status={
        invalidFieldCount > 0 || submitError || hasChanges ? (
          <div className="space-y-2 text-sm">
            {invalidFieldCount > 0 ? (
              <button
                type="button"
                onClick={scrollToFirstInvalidAdminSection}
                className="flex items-center gap-x-1.5 font-medium text-red-700 hover:text-red-800"
              >
                <ExclamationCircleIcon aria-hidden="true" className="size-5 shrink-0" />
                {invalidLabel}
              </button>
            ) : null}
            {submitError ? (
              <p role="alert" className="text-red-700">
                {submitError}
              </p>
            ) : null}
            {hasChanges && !isSubmitting ? (
              <p className="flex items-center gap-x-2 text-gray-600">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-yellow-600" />
                Ungespeicherte Änderungen
              </p>
            ) : null}
          </div>
        ) : null
      }
      secondary={secondary}
      destructive={destructive}
    />
  )
}
