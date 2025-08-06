import { createParser, useQueryState } from 'nuqs'
import { searchParamsRegistry } from './searchParamsRegistry'
import { createMemoizer } from './utils/createMemoizer'

const memoizer = createMemoizer()

type QaParamData = {
  configSlug: string
  style: string
}

const qaParamParser = createParser({
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
}).withDefault({ configSlug: '', style: 'none' })

export const useQaParam = () => {
  const [qaParamData, setQaParamData] = useQueryState(searchParamsRegistry.qa, qaParamParser)

  return memoizer({ qaParamData, setQaParamData })
}
