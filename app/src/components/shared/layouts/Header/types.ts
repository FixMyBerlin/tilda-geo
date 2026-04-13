import type { InternalPath } from '@/router'

export type PrimaryNavigation =
  | { name: string; to: InternalPath; hash?: string }
  | { name: string; href: `https://${string}` }

export type SecondaryNavigation = {
  name: string
  to: InternalPath
  hash?: string
}

export type PrimaryNavigationProps = {
  primaryNavigation: PrimaryNavigation[]
  secondaryNavigation: SecondaryNavigation[][]
}
