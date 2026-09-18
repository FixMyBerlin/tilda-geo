import type { ReactNode } from 'react'

export type AdminDescriptionListItem = {
  label: string
  value: ReactNode
}

/** Label/value rows for detail pages and `AdminTechnicalDetails`; empty values render „—“. */
export const AdminDescriptionList = ({ items }: { items: AdminDescriptionListItem[] }) => (
  <dl className="divide-y divide-gray-100">
    {items.map((item) => (
      <div key={item.label} className="py-2.5 first:pt-0 last:pb-0 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-900">{item.label}</dt>
        <dd className="mt-1 min-w-0 text-sm break-words text-gray-700 sm:col-span-2 sm:mt-0">
          {item.value === null || item.value === undefined || item.value === '' ? '—' : item.value}
        </dd>
      </div>
    ))}
  </dl>
)
