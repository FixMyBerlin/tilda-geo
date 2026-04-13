import type { InternalPath } from '@/router'

export type FooterMenuItem = {
  name: string
  to: InternalPath
}

export const footerLinks: FooterMenuItem[] = [
  { name: 'Start', to: '/' },
  { name: 'Regionen', to: '/regionen' },
  { name: 'Kontakt & Impressum', to: '/kontakt' },
  { name: 'Datenschutz', to: '/datenschutz' },
]
