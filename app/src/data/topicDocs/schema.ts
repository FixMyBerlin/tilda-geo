import { z } from 'zod'

const textSchema = z.string().min(1)
const topicDocNumericFormats = [
  'number',
  'meter',
  'kilometer',
  'kilometer_per_hour',
  'square_meter',
  'percent',
  'minutes',
  'floors',
  'population_label',
] as const
const topicDocDateFormats = ['date'] as const

export const topicDocAttributeFormatSchema = z.enum([
  'string',
  ...topicDocNumericFormats,
  ...topicDocDateFormats,
  'sanitized_strings',
  'ignore',
])

export const topicDocAttributePurposeSchema = z.enum(['experimentation', 'processing', 'qa'])

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
    })
    .strict(),
)

export const keyDocEntrySchema = z
  .object({
    key: z.string().min(1),
    format: topicDocAttributeFormatSchema.default('string'),
    label: textSchema.optional(),
    description: textSchema.optional(),
    chapterRefs: z.array(chapterLinkSchema).optional(),
    ref: z.string().min(1).optional(),
    valuesRef: z.string().min(1).optional(),
    valuesAdd: z.array(valueDocNodeSchema).optional(),
    values: z.array(valueDocNodeSchema).optional(),
    purpose: topicDocAttributePurposeSchema.optional(),
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
      attribute.format !== 'ignore' ||
      (!attribute.values?.length && !attribute.valuesRef && !attribute.valuesAdd?.length),
    {
      message: 'ignore forbids values, valuesRef, and valuesAdd',
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
export type TopicDocAttributeFormat = z.infer<typeof topicDocAttributeFormatSchema>
export type TopicDocAttributePurpose = z.infer<typeof topicDocAttributePurposeSchema>
export type TopicDocNumericFormat = (typeof topicDocNumericFormats)[number]
export type TopicDocDateFormat = (typeof topicDocDateFormats)[number]
export type TopicDocNumericUnitFormat = Exclude<TopicDocNumericFormat, 'number'>

type TopicDocFormatDisplay = {
  label: string
  suffix?: string
  title?: string
  documentedValuesIntro?: string
}

export const topicDocNumericFormatDisplay = {
  number: { label: 'Zahl' },
  meter: { label: 'Meter', suffix: 'm' },
  kilometer: { label: 'Kilometer', suffix: 'km' },
  kilometer_per_hour: { label: 'Kilometer pro Stunde', suffix: 'km/h' },
  square_meter: { label: 'Quadratmeter', suffix: 'm²' },
  percent: { label: 'Prozent', suffix: '%' },
  minutes: { label: 'Minuten', suffix: 'Minuten' },
  floors: { label: 'Stockwerke', suffix: 'Stockwerke' },
  population_label: { label: 'Einwohner:innen', suffix: 'Einwohner:innen' },
} satisfies Record<TopicDocNumericFormat, TopicDocFormatDisplay>

export const topicDocDateFormatDisplay = {
  date: { label: 'Datum' },
} satisfies Record<TopicDocDateFormat, TopicDocFormatDisplay>

export const topicDocSanitizedStringsFormatDisplay = {
  label: 'Zeichenkette',
  title: 'Wert aus OSM der technisch bereinigt wurde.',
  documentedValuesIntro:
    'Beliebige bereinigte Zeichenketten aus OSM. Von den vielen möglichen Werten sind folgende dokumentiert:',
} satisfies TopicDocFormatDisplay

export const topicDocNumericFormatSet = new Set<TopicDocNumericFormat>(topicDocNumericFormats)
export const topicDocDateFormatSet = new Set<TopicDocDateFormat>(topicDocDateFormats)

export const topicDocNumericFormatSuffix: Record<TopicDocNumericUnitFormat, string> =
  Object.fromEntries(
    (
      Object.entries(topicDocNumericFormatDisplay) as Array<
        [TopicDocNumericFormat, TopicDocFormatDisplay]
      >
    ).flatMap(([format, display]) =>
      format === 'number' || !display.suffix ? [] : [[format, display.suffix]],
    ),
  ) as Record<TopicDocNumericUnitFormat, string>

export const getTopicDocNumericFormatSuffix = (format: TopicDocNumericFormat) => {
  if (format === 'number') return undefined
  return topicDocNumericFormatSuffix[format]
}

export const isTopicDocDateFormat = (
  format: TopicDocAttributeFormat,
): format is TopicDocDateFormat => {
  return topicDocDateFormatSet.has(format as TopicDocDateFormat)
}

export const getTopicDocAttributeFormatDisplay = (
  format: TopicDocAttributeFormat,
): TopicDocFormatDisplay | undefined => {
  if (topicDocNumericFormatSet.has(format as TopicDocNumericFormat)) {
    return topicDocNumericFormatDisplay[format as TopicDocNumericFormat]
  }
  if (isTopicDocDateFormat(format)) {
    return topicDocDateFormatDisplay[format]
  }
  if (format === 'sanitized_strings') {
    return topicDocSanitizedStringsFormatDisplay
  }
  return undefined
}
