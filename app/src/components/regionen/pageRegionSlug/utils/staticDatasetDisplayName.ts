import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'

/** Name of a static dataset outside the sidebar; a style shows with its group, e.g. `Datensatz B – Standard`. */
export const staticDatasetDisplayName = ({ name, styleGroup }: RegionDataset) =>
  styleGroup ? `${styleGroup.name} – ${name}` : name
