import type { ReactNode } from 'react'
import type { FormApi } from '@/components/shared/form/types'
import type { AdminLinkTarget } from './AdminAsideActions'
import { AdminAsideLayout } from './AdminAsideLayout'
import { type AdminAsideSection, toAdminAsideSections } from './adminAsideSection'
import { AdminFormAsideActions } from './AdminFormAsideActions'

/**
 * Edit-page additions after the form field groups, inside the same aside layout. Pages compose
 * these (history, technical dump, list links, delete); the form only forwards the bag.
 */
export type AdminFormPageExtras = {
  sections: AdminAsideSection[]
  content: ReactNode
  secondaryActions?: ReactNode
  destructiveAction?: ReactNode
}

type Props<TValues> = {
  /** Jump list ids/titles of the form field groups, in page order. */
  fieldLabels: Record<string, string>
  extras?: AdminFormPageExtras
  form: FormApi<TValues>
  submitLabel: string
  cancel: AdminLinkTarget
  submitError?: string | null
  children: ReactNode
}

/**
 * Form page shell: field-group jump list + extras sections, aside actions (incl. extras’ secondary
 * and delete), field cards, then extras content. Use inside `Form`’s render prop.
 */
export function AdminFormLayout<TValues>({
  fieldLabels,
  extras,
  form,
  submitLabel,
  cancel,
  submitError,
  children,
}: Props<TValues>) {
  return (
    <AdminAsideLayout
      sections={[...toAdminAsideSections(fieldLabels), ...(extras?.sections ?? [])]}
      actions={
        <AdminFormAsideActions
          form={form}
          submitLabel={submitLabel}
          cancel={cancel}
          submitError={submitError}
          secondary={extras?.secondaryActions}
          destructive={extras?.destructiveAction}
        />
      }
    >
      {children}
      {extras?.content}
    </AdminAsideLayout>
  )
}
