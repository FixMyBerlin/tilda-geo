import { LinkIcon } from '@heroicons/react/20/solid'
import { useMatch } from '@tanstack/react-router'
import { Link } from '@/components/shared/links/Link'

type Props = {
  hash: string
}

export const MarkdownDocumentHeadingLink = ({ hash }: Props) => {
  const match = useMatch({ from: '/_pages/docs/$tableName', shouldThrow: false })
  if (!match) return null

  return (
    <Link
      to="/docs/$tableName"
      params={match.params}
      search={match.search}
      hash={hash}
      aria-label="Link zu diesem Abschnitt"
      classNameOverwrite="inline-flex shrink-0 items-center text-gray-400 no-underline opacity-0 transition-opacity duration-200 ease-in-out hover:text-gray-600 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-60"
    >
      <LinkIcon className="size-4" aria-hidden />
    </Link>
  )
}
