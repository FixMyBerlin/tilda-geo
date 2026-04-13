import { Link } from '@/components/shared/links/Link'
import { LinkMail } from '@/components/shared/links/LinkMail'
import { LinkTel } from '@/components/shared/links/LinkTel'

export function PageKontakt() {
  return (
    <>
      <h1>Kontakt und Impressum</h1>
      <p>
        <strong>FixMyCity GmbH</strong>
        <br />
        Oberlandstraße 26-35
        <br />
        12099 Berlin
        <br />
        <LinkMail subject="Feedback TILDA">feedback@fixmycity.de</LinkMail>
        <br />
        Telefon: <LinkTel>+49-30-54908665</LinkTel>
        <br />
      </p>
      <p>Gesellschafter: Boris Hekele und Heiko Rintelen</p>
      <p>
        Registergericht: Amtsgericht Berlin-Charlottenburg
        <br />
        Registernummer: HRB 205031 B
      </p>
      <p>Umsatzsteuer-Identifikationsnummer gem. § 27a UStG: DE323489466</p>
      <p>Verantwortlicher i.S.v. § 55 Rundfunkstaatsvertrag (RStV): Boris Hekele</p>
      <h2>Feedback &amp; Kontakt</h2>
      <p>
        Wir freuen uns über Kommentare Anregungen und Unterstützung an{' '}
        <LinkMail subject="Feedback TILDA">feedback@fixmycity.de</LinkMail>
      </p>
      <p>
        Sie finden uns auch auf{' '}
        <Link blank href="https://www.linkedin.com/company/fixmycity">
          LinkedIn
        </Link>
      </p>
      <p>
        Sofern Sie Bugs oder Verbesserungsvorschläge haben, geben Sie uns gerne{' '}
        <Link blank href="https://github.com/FixMyBerlin/tilda-geo/issues">
          auf GitHub Feedback
        </Link>
        . Sie können den Source Code auch weiterentwickeln. Lizenz:{' '}
        <Link href="https://github.com/FixMyBerlin/tilda-geo/blob/develop/LICENSE.md" blank>
          AGPL v3
        </Link>
        .
      </p>
      <h2>Urheberrechte Fotos</h2>
      <p>
        Wenn nicht anders angegeben stehen die auf dieser Website verwendeten Fotos unter{' '}
        <Link blank href="https://creativecommons.org/licenses/by-nc/4.0/">
          Creative Commons-Lizenz BY-NC 4.0
        </Link>
        .
      </p>
    </>
  )
}
