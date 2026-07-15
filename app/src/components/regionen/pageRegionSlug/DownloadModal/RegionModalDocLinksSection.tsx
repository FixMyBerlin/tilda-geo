import { Link } from '@/components/shared/links/Link'
import type { RegionModalDataset } from './regionModalAccess'

type Props = {
  regionSlug: string
  datasets: RegionModalDataset[]
}

export const RegionModalDocLinksSection = ({ regionSlug, datasets }: Props) => {
  if (datasets.length === 0) return null

  return (
    <ul className="list-disc space-y-2 pl-5">
      {datasets.map((dataset) => (
        <li key={dataset.tableName}>
          <Link
            to="/docs/$tableName"
            params={{ tableName: dataset.tableName }}
            search={{ r: regionSlug }}
          >
            Dokumentation für «{dataset.label}»
          </Link>
        </li>
      ))}
    </ul>
  )
}
