import type { InternalLinkTo } from '@/router'

export type PrimaryNavigation =
  | { name: string; to: InternalLinkTo; hash?: string }
  | { name: string; href: `https://${string}` }

export type SecondaryNavigation = {
  name: string
  to: InternalLinkTo
  hash?: string
}

export type PrimaryNavigationProps = {
  primaryNavigation: PrimaryNavigation[]
  secondaryNavigation: SecondaryNavigation[][]
}
