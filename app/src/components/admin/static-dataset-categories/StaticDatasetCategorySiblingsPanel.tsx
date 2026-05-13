import { Link } from '@/components/shared/links/Link'

export type StaticDatasetSiblingRow = {
  key: string
  categoryKey: string
  sortOrder: number
  title: string
}

export function StaticDatasetCategorySiblingsPanel({
  groupKey,
  rows,
}: {
  groupKey: string
  rows: StaticDatasetSiblingRow[]
}) {
  return (
    <aside className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/5 lg:sticky lg:top-6 lg:self-start">
      <h2 className="text-sm font-semibold text-gray-900">Weitere Kategorien dieser Gruppe</h2>
      <p className="mt-1 text-xs text-gray-500">
        Gruppe <span className="font-mono text-gray-700">{groupKey}</span> (wie in den
        Upload-Konfigurationen).
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">Keine weiteren Kategorien in dieser Gruppe.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-200 text-sm">
          {rows.map((row) => (
            <li key={row.key} className="flex gap-3 py-2.5 first:pt-0">
              <span className="w-10 shrink-0 pt-0.5 text-right font-mono text-xs text-gray-500 tabular-nums">
                {row.sortOrder}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to="/admin/static-dataset-categories/$categoryKey"
                  params={{ categoryKey: row.key }}
                  blank
                  classNameOverwrite="block font-mono text-sm font-medium text-yellow-800 underline hover:text-yellow-950"
                >
                  {row.categoryKey}
                </Link>
                <p className="mt-0.5 text-xs leading-snug text-gray-600">{row.title}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
