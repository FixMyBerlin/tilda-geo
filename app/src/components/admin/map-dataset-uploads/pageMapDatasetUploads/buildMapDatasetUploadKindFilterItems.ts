import type { FilterRowItem } from '@/components/shared/FilterRow/types'

export function buildMapDatasetUploadKindFilterItems(counts: {
  datasets: number
  system: number
}): FilterRowItem[] {
  return [
    { id: 'datasets', label: 'Daten', count: counts.datasets },
    { id: 'system', label: 'System', count: counts.system },
  ]
}
