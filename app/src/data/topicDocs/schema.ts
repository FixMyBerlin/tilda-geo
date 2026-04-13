import { z } from 'zod'

const textSchema = z.string().min(1)

export const chapterLinkSchema = z
  .object({
    chapterId: z.string().min(1),
  })
  .strict()

export const valueDocNodeSchema = z.lazy(() =>
  z
    .object({
      value: z.string().min(1),
      label: textSchema,
      description: textSchema.optional(),
      chapterRefs: z.array(chapterLinkSchema).optional(),
      children: z.array(valueDocNodeSchema).optional(),
    })
    .strict(),
)

export const keyDocEntrySchema = z
  .object({
    key: z.string().min(1),
    format: z.enum(['string', 'number', 'sanitized_strings', 'ignore']).default('string'),
    label: textSchema.optional(),
    description: textSchema.optional(),
    chapterRefs: z.array(chapterLinkSchema).optional(),
    ref: z.string().min(1).optional(),
    valuesRef: z.string().min(1).optional(),
    valuesAdd: z.array(valueDocNodeSchema).optional(),
    values: z.array(valueDocNodeSchema).optional(),
  })
  .strict()
  .refine(
    (attribute) => Boolean(attribute.ref || attribute.label || attribute.format === 'ignore'),
    {
      message: 'label is required unless ref is set or format is ignore',
      path: ['label'],
    },
  )
  .refine((attribute) => !(attribute.valuesRef && attribute.values), {
    message: 'Use either values or valuesRef, not both',
    path: ['valuesRef'],
  })
  .refine((attribute) => !(attribute.ref && attribute.values), {
    message: 'Use either values or ref, not both',
    path: ['ref'],
  })
  .refine((attribute) => !(attribute.ref && attribute.valuesRef), {
    message: 'Use either ref or valuesRef, not both',
    path: ['ref'],
  })
  .refine((attribute) => !attribute.valuesAdd || Boolean(attribute.valuesRef || attribute.ref), {
    message: 'valuesAdd requires valuesRef or ref',
    path: ['valuesAdd'],
  })
  .refine(
    (attribute) =>
      (attribute.format !== 'sanitized_strings' && attribute.format !== 'ignore') ||
      (!attribute.values?.length && !attribute.valuesRef && !attribute.valuesAdd?.length),
    {
      message: 'sanitized_strings and ignore forbid values, valuesRef, and valuesAdd',
      path: ['format'],
    },
  )

const topicDocsGroupSchema = z
  .object({
    groups: z.array(
      z
        .object({
          id: z.string().min(1),
          label: textSchema.optional(),
          tables: z.array(z.string().min(1)).default([]),
        })
        .strict(),
    ),
  })
  .strict()

// Required YAML block at the top of each `topic-docs/…/chapters/*.md` file (delimited by ---).
export const topicDocsChapterFrontMatterSchema = z
  .object({
    title: textSchema,
  })
  .strict()

export const topicDocsYamlSchema = z
  .object({
    title: textSchema,
    summary: textSchema.optional(),
    sourceIds: z.array(z.string().min(1)).default([]),
    attributes: z.array(keyDocEntrySchema).min(1),
  })
  .strict()

export const topicDocsGroupsYamlSchema = topicDocsGroupSchema

export type ValueDocNode = z.infer<typeof valueDocNodeSchema>
export type KeyDocEntry = z.infer<typeof keyDocEntrySchema>
export type TopicDocsYaml = z.infer<typeof topicDocsYamlSchema>
export type TopicDocsGroupsYaml = z.infer<typeof topicDocsGroupsYamlSchema>
export type TopicDocsChapterFrontMatter = z.infer<typeof topicDocsChapterFrontMatterSchema>
