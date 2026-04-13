import type { MapDataCategoryId } from '../../mapData/mapDataCategories/MapDataCategoryId'
import type { SourcesId } from '../../mapData/mapDataSources/sources.const'
import type { LegendId, StyleId, SubcategoryId } from '../../mapData/typeId'

type SubcatStyleKey = `${SubcategoryId}-${StyleId}`
export const createSubcatStyleKey = (subcatId: SubcategoryId, styleId: StyleId) =>
  `${subcatId}-${styleId}` satisfies SubcatStyleKey

type SubcatStyleLegendKey = `${SubcatStyleKey}-${LegendId}`
export const createSubcatStyleLegendKey = (
  subCat: SubcategoryId,
  styleId: StyleId,
  legendId: LegendId,
) => `${subCat}-${styleId}-${legendId}` satisfies SubcatStyleLegendKey

function createKey(obj: Record<string, string>) {
  return Object.entries(obj)
    .map(([shortKey, value]) => `${shortKey}:${value}`)
    .join('--')
}

const delimiter = '--'
function parseKey(key: string, shortToLong: Record<string, string>) {
  return Object.fromEntries(
    key.split(delimiter).map((s) => {
      const [shortKey, value] = s.split(':')
      // biome-ignore lint/style/noNonNullAssertion: This sometimes fail but the app deals with it
      const longKey = shortToLong[shortKey!]
      return [longKey, value]
    }),
  )
}

export function createLayerKeyAtlasGeo(
  sourceId: SourcesId,
  subCat: SubcategoryId,
  styleId: string,
  layerId: string,
) {
  return createKey({
    source: sourceId,
    subcat: subCat,
    style: styleId,
    layer: layerId,
  })
}

export function createSourceKeyAtlasGeo(
  categoryId: MapDataCategoryId,
  sourceId: SourcesId,
  subCat: SubcategoryId,
) {
  return createKey({
    cat: categoryId,
    source: sourceId,
    subcat: subCat,
  })
}

export function parseSourceKeyAtlasGeo(sourceKey: string) {
  // source: "cat:mapillary--source:mapillary_coverage--subcat:mapillaryCoverage"
  // returns: { categoryId: 'mapillary', sourceId: 'mapillary_coverage', subcategoryId: 'mapillaryCoverage' }
  return parseKey(sourceKey, {
    cat: 'categoryId',
    source: 'sourceId',
    subcat: 'subcategoryId',
  }) as {
    categoryId: MapDataCategoryId
    sourceId: SourcesId
    subcategoryId: SubcategoryId
  }
}

export function isSourceKeyAtlasGeo(key: string) {
  const { categoryId, sourceId, subcategoryId } = parseSourceKeyAtlasGeo(key)
  return !!categoryId && !!sourceId && !!subcategoryId
}
