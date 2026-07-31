import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import { SortableList } from '@/components/shared/sortable/SortableList'
import { navigationLinkPathError, type RegionFormInput } from '@/server/regions/regionWriteSchema'
import { withSortOrder } from '@/shared/orderedList/assignSortOrder'
import { newClientListKey } from '@/shared/orderedList/clientListKey'

type Props = {
  form: FormApi<RegionFormInput>
}

type NavLink = RegionFormInput['navigationLinks'][number]

const emptyNavLink = (sortOrder: number): NavLink => ({
  name: '',
  linkType: 'external',
  path: '',
  sortOrder,
  _key: newClientListKey(),
})

const isEmptyNavLink = (link: NavLink) => !link.name.trim() && !link.path.trim()

const ensureTrailingEmpty = (links: NavLink[]) => {
  const normalized = withSortOrder(links)
  const last = normalized.at(-1)
  if (!last || !isEmptyNavLink(last)) {
    return [...normalized, emptyNavLink(normalized.length)]
  }
  return normalized
}

function updateLink(links: NavLink[], index: number, patch: Partial<NavLink>) {
  return links.map((link, i) => (i === index ? { ...link, ...patch } : link))
}

type NavLinkRowProps = {
  link: NavLink
  index: number
  dragHandle?: ReactNode
  showDelete: boolean
  fadeIn: boolean
  onCommit: (links: NavLink[]) => void
  links: NavLink[]
}

function NavLinkRow({
  link,
  index,
  dragHandle,
  showDelete,
  fadeIn,
  onCommit,
  links,
}: NavLinkRowProps) {
  const pathError = navigationLinkPathError(link)
  const pathInputClassName = twJoin(
    'rounded border px-2 py-1',
    pathError ? 'border-red-800' : 'border-gray-300',
  )

  return (
    <motion.div
      initial={fadeIn ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap items-end gap-3 rounded border border-gray-200 p-3"
    >
      {dragHandle}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">Name</span>
        <input
          className="rounded border border-gray-300 px-2 py-1"
          value={link.name}
          onChange={(event) => onCommit(updateLink(links, index, { name: event.target.value }))}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">Typ</span>
        <select
          className="rounded border border-gray-300 px-2 py-1"
          value={link.linkType}
          onChange={(event) =>
            onCommit(
              updateLink(links, index, {
                linkType: event.target.value as NavLink['linkType'],
              }),
            )
          }
        >
          <option value="internal">Intern</option>
          <option value="external">Extern</option>
        </select>
      </label>
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">
          {link.linkType === 'internal' ? 'Pfad' : 'URL'}
        </span>
        <input
          className={pathInputClassName}
          value={link.path}
          placeholder={link.linkType === 'internal' ? '/regionen/:slug/…' : 'https://…'}
          aria-invalid={Boolean(pathError)}
          onChange={(event) => onCommit(updateLink(links, index, { path: event.target.value }))}
        />
        {pathError ? (
          <span role="alert" className="text-sm text-red-800">
            {pathError}
          </span>
        ) : null}
      </label>
      {showDelete ? (
        <AdminTrashIconButton
          ariaLabel={`Navigation-Link ${index + 1} entfernen`}
          onClick={() => onCommit(links.filter((_, i) => i !== index))}
        />
      ) : null}
    </motion.div>
  )
}

type NavigationLinksFieldProps = {
  value: NavLink[]
  onChange: (links: NavLink[]) => void
  fieldErrors: unknown[] | undefined
}

function NavigationLinksField({ value, onChange, fieldErrors }: NavigationLinksFieldProps) {
  const links = ensureTrailingEmpty(value)
  const [fadeInKey, setFadeInKey] = useState<string | null>(null)
  const errorLines = uniqueFormattedFormErrors(fieldErrors)

  const commit = (next: NavLink[]) => {
    const normalized = ensureTrailingEmpty(next)
    if (normalized.length > links.length) {
      setFadeInKey(normalized.at(-1)?._key ?? null)
    }
    onChange(normalized)
  }

  const handleReorder = (reordered: NavLink[]) => {
    const withoutEmpty = reordered.filter((link) => !isEmptyNavLink(link))
    commit(withoutEmpty)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Zusätzliche Links in der Regions-Navigation (Reihenfolge = Anzeige; per Ziehen am Griff
        sortieren). Neue Zeile erscheint automatisch, sobald Name oder Pfad/URL ausgefüllt ist;
        leere Zeilen werden beim Speichern ignoriert.
      </p>
      <SortableList
        items={links}
        getItemKey={(link) => link._key ?? `pending-${link.sortOrder}`}
        onReorder={handleReorder}
        renderItem={(link, { dragHandle }) => {
          const index = links.indexOf(link)
          const isTrailingEmpty = index === links.length - 1 && isEmptyNavLink(link)
          return (
            <NavLinkRow
              link={link}
              index={index}
              dragHandle={isTrailingEmpty ? undefined : dragHandle}
              showDelete={!isTrailingEmpty}
              fadeIn={fadeInKey === link._key}
              onCommit={commit}
              links={links}
            />
          )
        }}
      />
      {errorLines.length > 0 ? (
        <div role="alert" className="text-sm text-red-800">
          {errorLines.map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function RegionNavigationLinksEditor({ form }: Props) {
  return (
    <form.Field name="navigationLinks">
      {(field) => (
        <NavigationLinksField
          value={field.state.value}
          onChange={(links) => field.handleChange(links)}
          fieldErrors={field.state.meta.errors}
        />
      )}
    </form.Field>
  )
}
