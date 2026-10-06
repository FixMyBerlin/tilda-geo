import { BoltIcon } from '@heroicons/react/24/outline'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { adminCardClassName } from '@/components/admin/adminClasses'
import { ConfirmDialog } from '@/components/shared/dialog/ConfirmDialog'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { toastError } from '@/components/shared/toast/toastError'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import {
  adminPrivateHookUiItems,
  triggerPrivateHookAdminFn,
} from '@/server/admin/adminPrivateHooks.functions'

type HookItem = (typeof adminPrivateHookUiItems)[number]

const triggerButtonClassName = twMerge(
  buttonStylesSecondary,
  'shrink-0 gap-x-2 px-3 py-1.5 text-sm',
)

/** Manual triggers for the post-processing pipeline hooks (confirm first, result as toast). */
export function ProcessingPrivateHooksSection() {
  const [confirmItem, setConfirmItem] = useState<HookItem | null>(null)

  const trigger = useMutation({
    mutationFn: async (item: HookItem) => {
      const result = await triggerPrivateHookAdminFn({ data: { slug: item.slug } })
      if (!result.ok) {
        throw new Error(`${item.label}: Fehler HTTP ${result.status} – ${result.message}`)
      }
      return result
    },
    onSuccess: (result, item) => {
      toastSuccess(`${item.label}: ${result.message}`)
    },
    onError: (error, item) => {
      toastError(error, `${item.label}: Unbekannter Fehler`)
    },
  })

  return (
    <>
      <ul className={twJoin(adminCardClassName, 'divide-y divide-gray-200')}>
        {adminPrivateHookUiItems.map((item) => (
          <li
            key={item.slug}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
          >
            <div className="min-w-0">
              <p className="text-sm/6 font-semibold text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-600">
                {'longRunning' in item && item.longRunning
                  ? 'Kann sehr lange dauern; der Server wartet auf den Abschluss.'
                  : 'Läuft im Hintergrund.'}
              </p>
            </div>
            <button
              type="button"
              disabled={trigger.isPending}
              className={twJoin(triggerButtonClassName, 'self-start sm:self-auto')}
              onClick={() => setConfirmItem(item)}
            >
              {trigger.isPending && trigger.variables?.slug === item.slug ? <SmallSpinner /> : null}
              {trigger.isPending && trigger.variables?.slug === item.slug ? 'Läuft …' : 'Auslösen'}
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmItem !== null}
        setOpen={(open) => {
          if (!open) setConfirmItem(null)
        }}
        icon={BoltIcon}
        title={confirmItem ? `${confirmItem.label}?` : ''}
        description={confirmItem?.confirmMessage}
        confirmLabel="Auslösen"
        onConfirm={() => {
          if (!confirmItem) return
          setConfirmItem(null)
          trigger.mutate(confirmItem)
        }}
      />
    </>
  )
}
