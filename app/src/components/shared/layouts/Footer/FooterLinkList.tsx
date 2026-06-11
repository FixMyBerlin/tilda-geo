import type { LinkProps } from '@/components/shared/links/Link'
import { Link } from '@/components/shared/links/Link'
import type { FooterLinkGroup } from './footerLinks.const'

type InternalTo = Extract<LinkProps, { to: unknown }>['to']

type Props = {
  group: FooterLinkGroup
}

const linkClassName =
  'block text-sm leading-6 text-gray-400 decoration-gray-600 decoration-1 underline-offset-2 hover:text-white! hover:decoration-white'

export const FooterLinkList = ({ group }: Props) => {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
        {group.heading}
      </h3>
      <ul className="mt-4 space-y-3">
        {group.links.map((item) =>
          item.href != null ? (
            <li key={item.name}>
              <Link href={item.href} blank className={linkClassName}>
                {item.name}
              </Link>
            </li>
          ) : (
            <li key={item.name}>
              <Link to={item.to as InternalTo} className={linkClassName}>
                {item.name}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
