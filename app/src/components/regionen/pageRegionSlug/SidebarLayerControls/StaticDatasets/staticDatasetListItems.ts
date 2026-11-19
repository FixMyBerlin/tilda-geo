import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import { createSourceKeyStaticDatasets } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'

type Style = { key: string; dataset: RegionDataset }

/** One entry in a static dataset category: a single config, or a style group of configs. */
export type StaticDatasetListItem =
  | { type: 'dataset'; key: string; name: string; dataset: RegionDataset }
  | {
      type: 'styleGroup'
      key: string
      name: string
      /** Ordered as in `meta.ts`; the first one is the default style. */
      styles: [Style, ...Style[]]
    }

const datasetKey = (dataset: RegionDataset) =>
  createSourceKeyStaticDatasets(dataset.id, dataset.subId)

/** Groups configs that share a style group into one entry; entries sorted by name. */
export const createStaticDatasetListItems = (datasets: RegionDataset[]) => {
  const items: StaticDatasetListItem[] = []
  for (const dataset of datasets) {
    const { styleGroup } = dataset
    if (!styleGroup) {
      items.push({ type: 'dataset', key: datasetKey(dataset), name: dataset.name, dataset })
      continue
    }
    const style: Style = { key: datasetKey(dataset), dataset }
    const group = items.find((item) => item.type === 'styleGroup' && item.key === styleGroup.key)
    if (group?.type === 'styleGroup') {
      group.styles.push(style)
    } else {
      items.push({
        type: 'styleGroup',
        key: styleGroup.key,
        name: styleGroup.name,
        styles: [style],
      })
    }
  }

  for (const item of items) {
    if (item.type === 'styleGroup') {
      item.styles.sort(
        (a, b) => (a.dataset.styleGroup?.position ?? 0) - (b.dataset.styleGroup?.position ?? 0),
      )
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

/** All `data` param keys of an entry. */
export const listItemKeys = (item: StaticDatasetListItem) =>
  item.type === 'dataset' ? [item.key] : item.styles.map(({ key }) => key)

/** The key that turns an entry on: the dataset, or the default style of a group. */
export const listItemDefaultKey = (item: StaticDatasetListItem) =>
  item.type === 'dataset' ? item.key : item.styles[0].key

/** The active style of a group: the first of its keys in the `data` param. */
export const activeStyleKey = (dataParam: string[], styleKeys: string[]) =>
  dataParam.find((param) => styleKeys.includes(param))

/**
 * Switches a style group to `newKey`: removes every other style of the group from the `data` param
 * and puts `newKey` where the first one was, so the URL keeps its order. On the map the new style
 * is drawn on top, like any dataset that was just turned on.
 */
export const selectStyle = (dataParam: string[], styleKeys: string[], newKey: string) => {
  const position = dataParam.findIndex((param) => styleKeys.includes(param))
  const others = dataParam.filter((param) => !styleKeys.includes(param))
  if (position === -1) return [...others, newKey]
  return [...others.slice(0, position), newKey, ...others.slice(position)]
}
