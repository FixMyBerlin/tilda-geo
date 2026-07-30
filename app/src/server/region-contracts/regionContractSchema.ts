import { z } from 'zod'
import { slugSchema } from '@/lib/slugSchema'
import { RegionContractStatus } from '@/prisma/generated/browser'

const RegionContractStatusSchema = z.enum(RegionContractStatus)

export const RegionContractConfigSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  status: RegionContractStatusSchema,
  regionSlugs: z.array(z.string().min(1)),
})

export type RegionContractConfigInput = z.infer<typeof RegionContractConfigSchema>

const RegionContractFormRawSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  status: RegionContractStatusSchema,
  regionSlugs: z.array(z.string()),
})

export type RegionContractFormInput = z.input<typeof RegionContractFormRawSchema>

const RegionContractFormSchema = RegionContractFormRawSchema.transform(
  (form): RegionContractConfigInput => ({
    slug: form.slug,
    name: form.name,
    status: form.status,
    regionSlugs: form.regionSlugs.filter(Boolean),
  }),
).pipe(RegionContractConfigSchema)

export const CreateRegionContractFormSchema = RegionContractFormSchema

export const UpdateRegionContractFormSchema = RegionContractFormSchema

export const DeleteRegionContractSchema = z.object({
  slug: z.string(),
})

export function regionContractConfigToFormValues(config: RegionContractConfigInput) {
  return {
    slug: config.slug,
    name: config.name,
    status: config.status,
    regionSlugs: config.regionSlugs,
  }
}
