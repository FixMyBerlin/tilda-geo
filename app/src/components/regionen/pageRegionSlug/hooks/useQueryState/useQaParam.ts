import { createParser, useQueryState } from 'nuqs'
import { searchParamsRegistry } from './searchParamsRegistry'

type QaParamData = {
  configSlug: string
  style: string
}

/** Legacy key: renamed to user-pending-problematic so old URLs/bookmarks still work. */
const LEGACY_QA_STYLE_MAP: Record<string, string> = {
  'user-pending': 'user-pending-problematic',
}

const qaParamParser = createParser({
  parse: (query) => {
    if (!query) return { configSlug: '', style: 'none' }

    const parts = query.split('--')
    if (parts.length < 2) return { configSlug: '', style: 'none' }

    const style = parts[parts.length - 1] || 'none'
    const configSlug = parts.slice(0, -1).join('--')

    return { configSlug, style: LEGACY_QA_STYLE_MAP[style] ?? style }
  },
  serialize: (data: QaParamData) => {
    if (!data.configSlug || data.style === 'none') return ''
    return `${data.configSlug}--${data.style}`
  },
}).withDefault({ configSlug: '', style: 'none' })

export const useQaParam = () => {
  const [qaParamData, setQaParamData] = useQueryState(
    searchParamsRegistry.qa,
    qaParamParser.withOptions({
      shallow: false, // Trigger server re-render when QA config changes
    }),
  )

  return { qaParamData, setQaParamData }
}
