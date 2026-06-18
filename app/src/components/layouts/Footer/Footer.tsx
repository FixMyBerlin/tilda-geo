import { Img } from '@/components/shared/Img'
import { Link } from '@/components/shared/links/Link'
import svgTildaLogo from '../assets/tilda-logo-weiss.svg'
import { FooterLinkList } from './FooterLinkList'
import { footerLinkGroups } from './footerLinks.const'

export const Footer = () => {
  return (
    <footer className="z-0 bg-gray-800 py-12 print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="shrink-0">
            <Img src={svgTildaLogo} alt="TILDA Logo" className="h-8 w-auto text-yellow-400" />
            <p className="mt-4 text-sm text-gray-400">Verkehrsplanung neu gedacht</p>
          </div>
          <div className="flex flex-1 lg:justify-end">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {footerLinkGroups.map((group) => (
                <FooterLinkList key={group.heading} group={group} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-sm text-gray-400">
            Ein Produkt von{' '}
            <Link
              href="https://fixmycity.de"
              blank
              className="text-gray-400 underline decoration-gray-600 decoration-1 underline-offset-2 hover:text-white hover:decoration-white"
            >
              FixMyCity GmbH
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
