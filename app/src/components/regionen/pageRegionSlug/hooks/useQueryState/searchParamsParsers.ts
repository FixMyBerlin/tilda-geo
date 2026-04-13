import { createParser, parseAsBoolean, parseAsJson } from 'nuqs'
import { z } from 'zod'
import { parseMapParam, serializeMapParam } from './utils/mapParam'

// Shared parsers for client and server
export const zodInternalNotesFilterParam = z.object({
  query: z.string().optional().nullable(),
  completed: z.boolean().optional().nullable(),
  user: z.string().optional().nullable(),
  commented: z.boolean().optional().nullable(),
  notReacted: z.boolean().optional().nullable(),
})

export const zodQaFilterParam = z.object({
  users: z.array(z.coerce.number()).optional().nullable(),
})

type QaParamData = {
  configSlug: string
  style: string
}

export const searchParamsParsers = {
  atlasNotes: parseAsBoolean.withDefault(false).withOptions({
    shallow: false, // Trigger server re-render when changed
  }),
  atlasNote: createParser({
    parse: (query) => parseMapParam(query),
    serialize: (object) => serializeMapParam(object),
  }).withOptions({
    history: 'replace',
    throttleMs: 1000,
    shallow: false,
  }),
  atlasNotesFilter: parseAsJson(zodInternalNotesFilterParam.parse).withOptions({
    shallow: false, // Trigger server re-render when filter changes
  }),
  qaFilter: parseAsJson(zodQaFilterParam.parse).withOptions({
    shallow: false, // Trigger server re-render when filter changes
  }),
  qa: createParser({
    parse: (query) => {
      if (!query) return { configSlug: '', style: 'none' }
      const parts = query.split('--')
      if (parts.length < 2) return { configSlug: '', style: 'none' }
      const style = parts[parts.length - 1] || 'none'
      const configSlug = parts.slice(0, -1).join('--')
      return { configSlug, style }
    },
    serialize: (data: QaParamData) => {
      if (!data.configSlug || data.style === 'none') return ''
      return `${data.configSlug}--${data.style}`
    },
  })
    .withDefault({ configSlug: '', style: 'none' })
    .withOptions({
      shallow: false, // Trigger server re-render when QA config changes
    }),
}
