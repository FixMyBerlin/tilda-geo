import { twMerge } from 'tailwind-merge'
import type { LinkProps } from '@/components/shared/links/Link'
import { Link } from '@/components/shared/links/Link'
import type { FooterMenuItem } from './footerLinks.const'

type Props = {
  linkList: FooterMenuItem[]
  className?: string
}

type InternalTo = Extract<LinkProps, { to: unknown }>['to']

export const FooterLinkList = ({ linkList, className }: Props) => {
  return (
    <ul
      className={twMerge(
        'flex flex-col space-y-3 text-center sm:flex-row sm:justify-end sm:space-y-0 sm:gap-x-8 sm:text-left',
        className,
      )}
    >
      {linkList.map((item) => (
        <li key={item.name}>
          <Link
            to={item.to as InternalTo}
            className="block text-base leading-5 text-gray-50 decoration-gray-400 decoration-1 underline-offset-2 hover:text-white! hover:decoration-white"
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
