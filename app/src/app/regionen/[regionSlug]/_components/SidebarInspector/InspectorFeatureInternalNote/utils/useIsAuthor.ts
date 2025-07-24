import { useSession } from '@blitzjs/auth'

/** @desc Check if `session.userId` and `note.author.id` or `noteComment.author.id` are the same. Handle `userHasPermission()` before to check if user has permissions on the region in general. There might be an edge case where the noteAutor was removed from the region but this test would still be true, which is still OK. */
export const useIsAuthor = (autorId: number) => {
  const { userId } = useSession()
  return autorId === userId
}
