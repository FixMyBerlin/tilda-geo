import { z } from 'zod'

const withMessageSchema = z.object({ message: z.string() })
const withFormSchema = z.object({ form: z.string() })

const primitiveFormErrorSchema = z.union([
  z.null().transform(() => ''),
  z.undefined().transform(() => ''),
  z.union([z.string(), z.number(), z.boolean(), z.bigint()]).pipe(z.coerce.string()),
])

const isPlainFormErrorObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const joinFormattedFormErrors = (items: unknown[], parse: (value: unknown) => string) =>
  items
    .map((item) => parse(item))
    .filter(Boolean)
    .join(', ')

const dedupeAndJoinMessages = (messages: string[]) => {
  const unique = [...new Set(messages.filter(Boolean))]
  return unique.length > 0 ? unique.join(', ') : ''
}

const stringifyFormErrorFallback = (value: unknown) => {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

const nestedFormErrorRecordSchema = (parseNested: (value: unknown) => string) =>
  z.record(z.string(), z.unknown()).transform((record, ctx) => {
    const joined = dedupeAndJoinMessages(Object.values(record).map((item) => parseNested(item)))
    return joined || stringifyFormErrorFallback(ctx.value)
  })

const knownFormErrorObjectSchema = (parseNested: (value: unknown) => string) =>
  z.union([
    withMessageSchema.transform((data) => data.message),
    withFormSchema.transform((data) => data.form),
    nestedFormErrorRecordSchema(parseNested),
  ])

const parseFormErrorObjectOnce = (
  obj: object,
  seen: WeakSet<object>,
  parse: (value: unknown) => string,
) => {
  if (seen.has(obj)) return ''
  seen.add(obj)
  return knownFormErrorObjectSchema(parse).parse(obj)
}

const cycleSafeFormErrorObjectSchema = (seen: WeakSet<object>, parse: (value: unknown) => string) =>
  z
    .custom<object>(isPlainFormErrorObject)
    .transform((obj) => parseFormErrorObjectOnce(obj, seen, parse))

const formErrorArraySchema = (parse: (value: unknown) => string) =>
  z.array(z.unknown()).transform((items) => joinFormattedFormErrors(items, parse))

function createFormErrorParser(seen: WeakSet<object>) {
  const formErrorSchema: z.ZodType<string> = z.lazy(() =>
    z.union([
      primitiveFormErrorSchema,
      formErrorArraySchema((value) => formErrorSchema.parse(value)),
      cycleSafeFormErrorObjectSchema(seen, (value) => formErrorSchema.parse(value)),
    ]),
  )

  return formErrorSchema
}

/** Normalize form/field error to string (Standard Schema and adapters may return objects with .message). */
export function formatFormError(err: unknown) {
  const result = createFormErrorParser(new WeakSet()).safeParse(err)
  return result.success ? result.data : String(err)
}

/** Deduplicate by formatted message — Zod/adapters may attach multiple issues with the same text; keys must stay unique in lists. */
export function uniqueFormattedFormErrors(errors: unknown[] | undefined) {
  if (!errors?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const err of errors) {
    const s = formatFormError(err)
    if (s !== '' && !seen.has(s)) {
      seen.add(s)
      out.push(s)
    }
  }
  return out
}
