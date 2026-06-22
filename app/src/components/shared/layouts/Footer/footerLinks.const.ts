import type { InternalPath } from '@/router'

export type FooterLink =
  | { name: string; to: InternalPath; href?: never }
  | { name: string; href: string; to?: never }

export type FooterLinkGroup = {
  heading: string
  links: FooterLink[]
}

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    heading: 'FixMyCity',
    links: [
      { name: 'Über TILDA', href: 'https://fixmycity.de/tilda/' },
      { name: 'Referenzen', href: 'https://fixmycity.de/referenzen/' },
      { name: 'Mehr zu unserem Produkt Trassenscout', href: 'https://trassenscout.de' },
      {
        name: 'Weitere Dienstleistungen von FixMyCity',
        href: 'https://fixmycity.de/dienstleistungen/',
      },
      { name: 'Zum Newsletter anmelden', href: 'https://fixmycity.de/kontakt/' },
      { name: 'Demo vereinbaren', href: 'https://fixmycity.de/termin-vereinbaren/' },
    ],
  },
  {
    heading: 'Rechtliches',
    links: [
      { name: 'Kontakt & Impressum', to: '/kontakt' },
      { name: 'Datenschutz', to: '/datenschutz' },
    ],
  },
]
