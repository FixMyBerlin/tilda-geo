import { ModeListCount, type ModeListCountNouns } from '../ModeListCount'
import { useQaAreaList } from './useQaAreaList'

const nouns = {
  singular: 'Bereich',
  plural: 'Bereiche',
  pluralDative: 'Bereichen',
} satisfies ModeListCountNouns

export const QaModeListCount = () => {
  const { data, isError, configSlug } = useQaAreaList()

  if (!configSlug || isError) return null
  if (!data) return <ModeListCount count={{ status: 'loading' }} nouns={nouns} />

  const shown = data.items.length
  return (
    <ModeListCount
      count={
        data.totalCount > shown
          ? { status: 'capped', shown, total: data.totalCount }
          : { status: 'counted', shown }
      }
      nouns={nouns}
    />
  )
}
