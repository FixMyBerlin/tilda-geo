import {
  AdminDescriptionList,
  type AdminDescriptionListItem,
} from '@/components/admin/AdminDescriptionList'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { ObjectDump } from '@/components/admin/ObjectDump'

type Props = {
  /** Section id for the jump list — usually `technical`. */
  id: string
  /** IDs, keys, timestamps … */
  items?: AdminDescriptionListItem[]
  /** Raw records as collapsed JSON (default closed). */
  dumps: { title: string; data: unknown }[]
}

/** Last section on edit / detail pages (after the history). */
export const AdminTechnicalDetails = ({ id, items, dumps }: Props) => (
  <AdminFormSection id={id} title="Technische Details">
    {items?.length ? <AdminDescriptionList items={items} /> : null}
    {dumps.length ? (
      <div className="space-y-2">
        {dumps.map((dump) => (
          <ObjectDump key={dump.title} title={dump.title} data={dump.data} />
        ))}
      </div>
    ) : null}
  </AdminFormSection>
)
