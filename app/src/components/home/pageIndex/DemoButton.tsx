import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Link } from '@/components/shared/links/Link'

const href = 'https://fixmycity.de/termin-vereinbaren/'

type Props = {
  variant: 'brand' | 'white'
}

export const DemoButton = ({ variant }: Props) => {
  const className =
    variant === 'brand'
      ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-base font-medium text-gray-900 no-underline shadow-lg transition-colors select-none hover:bg-brand/70 focus-visible:ring-2 focus-visible:ring-yellow-800/40 focus-visible:outline-none active:bg-brand/70'
      : 'inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-900 no-underline shadow-lg transition-colors select-none hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-gray-900/20 focus-visible:outline-none active:bg-white/70'

  return (
    <Link href={href} classNameOverwrite={className} blank>
      Jetzt kostenlose Demo anfragen
      <ArrowTopRightOnSquareIcon className="size-5" aria-hidden />
    </Link>
  )
}
