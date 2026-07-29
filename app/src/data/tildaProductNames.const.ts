import { RegionProduct } from '@/prisma/generated/browser'

/** Branded product name shown in region header / page title. */
export const productName = {
  radverkehr: 'TILDA Radverkehr',
  parkraum: 'TILDA Parkraum',
  fussverkehr: 'TILDA Fußverkehr',
  analysis: 'TILDA Datenanalyse',
} as const satisfies Record<RegionProduct, string>

/** Short labels for admin region form select. */
const regionProductFormLabel = {
  radverkehr: 'Radverkehr',
  parkraum: 'Parkraum',
  fussverkehr: 'Fußverkehr',
  analysis: 'Analyse',
} as const satisfies Record<RegionProduct, string>

export const regionProductFormItems = (Object.values(RegionProduct) as RegionProduct[]).map(
  (value) => ({
    value,
    label: regionProductFormLabel[value],
  }),
)
