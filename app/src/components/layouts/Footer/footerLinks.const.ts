import type { InternalPath } from '@/router'

type FooterLink =
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
      { name: 'TILDA in der Praxis', href: 'https://fixmycity.de/referenzen/' },
      { name: 'Der Trassenscout - für komplexe Projekte', href: 'https://trassenscout.de' },
      {
        name: 'Weitere Dienstleistungen',
        href: 'https://fixmycity.de/dienstleistungen/',
      },
      { name: 'Demo-Termin vereinbaren', href: 'https://fixmycity.de/termin-vereinbaren/' },
      { name: 'Newsletter abonnieren', href: 'https://fixmycity.de/kontakt/' },
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
