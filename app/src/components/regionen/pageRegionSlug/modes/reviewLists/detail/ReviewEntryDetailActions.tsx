import { ReviewEntryDeleteButton } from './ReviewEntryDeleteButton'
import { ReviewEntryGeometryEditButton } from './ReviewEntryGeometryEditButton'
import { ReviewEntryPropertiesEditButton } from './ReviewEntryPropertiesEditButton'

type Props = { entryId: number; listId: number }

/** Detail-header actions for an open Prüfeintrag: properties, geometry, delete. */
export const ReviewEntryDetailActions = ({ entryId, listId }: Props) => (
  <>
    <ReviewEntryPropertiesEditButton entryId={entryId} listId={listId} />
    <ReviewEntryGeometryEditButton />
    <ReviewEntryDeleteButton entryId={entryId} />
  </>
)
