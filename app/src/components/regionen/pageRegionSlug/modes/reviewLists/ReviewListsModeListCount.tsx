import { ModeListCount, type ModeListCountNouns } from '../ModeListCount'
import { useReviewListEntries } from './useReviewListEntries'

const nouns = {
  singular: 'Eintrag',
  plural: 'Einträge',
  pluralDative: 'Einträgen',
} satisfies ModeListCountNouns

export const ReviewListsModeListCount = () => {
  const { selectedListId, isLoading, isError, entries } = useReviewListEntries()

  if (selectedListId === undefined || isError) return null
  if (isLoading) return <ModeListCount count={{ status: 'loading' }} nouns={nouns} />

  return <ModeListCount count={{ status: 'counted', shown: entries.length }} nouns={nouns} />
}
