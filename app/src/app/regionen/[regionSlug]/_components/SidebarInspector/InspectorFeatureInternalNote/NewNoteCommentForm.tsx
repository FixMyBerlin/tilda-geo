import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { buttonStylesOnYellow } from '@/src/app/_components/links/styles'
import { useHasPermissions } from '@/src/app/_hooks/useHasPermissions'
import createNoteComment from '@/src/server/notes/mutations/createNoteComment'
import getNoteAndComments from '@/src/server/notes/queries/getNoteAndComments'
import { getQueryClient, getQueryKey, useMutation } from '@blitzjs/rpc'
import dompurify from 'dompurify'
import { useRef } from 'react'
import { useStaticRegion } from '../../regionUtils/useStaticRegion'

type Props = { noteId: number }

export const NewNoteCommentForm = ({ noteId }: Props) => {
  const [createNoteCommentMutation, { isLoading, error }] = useMutation(createNoteComment)
  const region = useStaticRegion()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const sanitize = (input: string) => (input ? dompurify.sanitize(input) : input)
    createNoteCommentMutation(
      {
        regionSlug: region!.slug,
        noteId,
        body: sanitize(new FormData(event.currentTarget).get('body')!.toString()),
      },
      {
        onSuccess: () => {
          // NOTE: Remove once we update to the newest react-compiler-esling-package that fixed this false positive https://github.com/facebook/react/issues/29703#issuecomment-2166763791
          // eslint-disable-next-line react-compiler/react-compiler
          textareaRef.current!.value = ''
          const queryKey = getQueryKey(getNoteAndComments, { id: noteId })
          getQueryClient().invalidateQueries(queryKey)
        },
      },
    )
  }

  // All users with permissions on the region may also comment
  const hasPermissions = useHasPermissions()
  if (!hasPermissions) {
    return null
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        <span className="sr-only">Antwort (Markdown)</span>
        <textarea
          ref={textareaRef}
          name="body"
          className="block min-h-28 w-full rounded-md border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600"
          data-1p-ignore
          data-lpignore
        />
      </label>

      <div className="mt-3 flex items-center gap-1 leading-tight">
        <button type="submit" className={buttonStylesOnYellow} disabled={isLoading}>
          Antwort speichern
        </button>
        {isLoading && <SmallSpinner />}
      </div>

      {/* @ts-expect-errors TODO Research how the error message is provided by Blitz */}
      {error ? <p className="text-red-500">{error.message}</p> : null}
    </form>
  )
}
