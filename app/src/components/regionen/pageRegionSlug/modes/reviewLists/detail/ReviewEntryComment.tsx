import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import {
  getReviewEntryFn,
  updateReviewEntryCommentFn,
} from '@/server/review-lists/review-lists.functions'
import { ModeComment } from '../../ModeComment'
import { ModeCommentEditButton } from '../../ModeCommentEditButton'
import { ModeCommentMarkdown } from '../../ModeCommentMarkdown'
import { ModeCommentTime } from '../../ModeCommentTime'
import { useIsAuthor } from '../../notes/detail/utils/useIsAuthor'

type Comment = NonNullable<Awaited<ReturnType<typeof getReviewEntryFn>>>['comments'][number]

type Props = {
  comment: Comment
  regionSlug: string
  onSaved: () => Promise<unknown>
}

export const ReviewEntryComment = ({ comment, regionSlug, onSaved }: Props) => {
  const isAuthor = useIsAuthor(comment.author.id)

  return (
    <ModeComment
      actions={
        isAuthor ? (
          <ModeCommentEditButton
            authorId={comment.author.id}
            body={comment.body}
            mode="reviewLists"
            onSave={async (body) => {
              await updateReviewEntryCommentFn({
                data: { regionSlug, commentId: comment.id, body },
              })
              await onSaved()
            }}
          />
        ) : undefined
      }
      body={<ModeCommentMarkdown variant="notes" markdown={comment.body} />}
      author={
        <OsmUserLink
          firstName={comment.author.firstName}
          lastName={comment.author.lastName}
          osmName={comment.author.osmName}
          showMembership={false}
        />
      }
      date={<ModeCommentTime createdAt={comment.createdAt} updatedAt={comment.updatedAt} />}
    />
  )
}
