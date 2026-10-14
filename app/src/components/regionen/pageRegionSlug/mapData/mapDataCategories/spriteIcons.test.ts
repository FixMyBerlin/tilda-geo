import { describe, expect, test } from 'vitest'
import baseStyle from '@/server/api/map-style/style.json'
import sprite from '../../../../../../public/map-style/sprite.json'
import sprite2x from '../../../../../../public/map-style/sprite@2x.json'
import { noteIconLayout } from '../../modes/notes/noteIconLayout'
import { debugLayerStyles } from '../mapDataSubcategories/layers/debugLayerStyles'
import { categories } from './categories.const'

const IMAGE_PROPERTIES = ['icon-image', 'fill-pattern', 'line-pattern']

/** The image ids an expression can resolve to. Ids built from feature data are not covered. */
const imageIds = (expression: unknown): string[] => {
  if (typeof expression === 'string') return expression ? [expression] : []
  if (!Array.isArray(expression)) return []
  const [operator, ...args] = expression
  switch (operator) {
    case 'match': // input, label, output, label, output, …, fallback
      return args.flatMap((arg, i) =>
        (i >= 2 && i % 2 === 0) || i === args.length - 1 ? imageIds(arg) : [],
      )
    case 'case': // condition, output, condition, output, …, fallback
      return args.flatMap((arg, i) => (i % 2 === 1 || i === args.length - 1 ? imageIds(arg) : []))
    case 'step': // input, output, stop, output, …
      return args.flatMap((arg, i) => (i % 2 === 1 ? imageIds(arg) : []))
    case 'coalesce':
      return args.flatMap(imageIds)
    case 'image':
      return imageIds(args[0])
    default:
      return []
  }
}

type Layer = { id: string; layout?: Record<string, unknown>; paint?: Record<string, unknown> }

const usedImageIds = (layers: Layer[]) =>
  layers.flatMap((layer) =>
    IMAGE_PROPERTIES.flatMap((property) =>
      imageIds(layer.layout?.[property] ?? layer.paint?.[property]).map((imageId) => ({
        layerId: layer.id,
        imageId,
      })),
    ),
  )

describe('map sprite', () => {
  const spriteIds = new Set(Object.keys(sprite))

  test('has every icon the category layers use', () => {
    const layers = categories.flatMap((category) =>
      category.subcategories.flatMap((subcategory) =>
        subcategory.styles.flatMap((style) => (style.layers ?? []) as Layer[]),
      ),
    )
    const used = usedImageIds(layers)
    expect(used.length).toBeGreaterThan(10)
    expect(used.filter(({ imageId }) => !spriteIds.has(imageId))).toEqual([])
  })

  test('has every icon the notes and debug layers use', () => {
    const layers = [
      { id: 'notes-osm', layout: noteIconLayout('osm') },
      { id: 'notes-intern', layout: noteIconLayout('intern') },
      ...(debugLayerStyles({ source: 'debug', sourceLayer: 'debug' }) as Layer[]),
    ] as Layer[]
    const used = usedImageIds(layers)
    expect(used.length).toBe(5)
    expect(used.filter(({ imageId }) => !spriteIds.has(imageId))).toEqual([])
  })

  test('has every icon the base style uses', () => {
    const used = usedImageIds(baseStyle.layers as Layer[])
    expect(used.length).toBeGreaterThan(0)
    expect(used.filter(({ imageId }) => !spriteIds.has(imageId))).toEqual([])
  })

  test('has the same icons for both pixel ratios', () => {
    expect(Object.keys(sprite2x).sort()).toEqual(Object.keys(sprite).sort())
  })
})
