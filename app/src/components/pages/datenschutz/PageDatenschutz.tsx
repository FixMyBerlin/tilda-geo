import { TableOfContents } from '@/components/pages/TableOfContents/TableOfContents'
import type { TocHashLink } from '@/components/pages/TableOfContents/types'
import { Link } from '@/components/shared/links/Link'
import { LinkMail } from '@/components/shared/links/LinkMail'
import { LinkTel } from '@/components/shared/links/LinkTel'

const tocItems: TocHashLink = [
  ['#responsible', 'Verantwortlichkeit'],
  ['#hosting', 'Bereitstellung'],
  ['#youtube', 'YouTube'],
  ['#contact', 'Kontaktmöglichkeit'],
  ['#rights', 'Ihre Rechte'],
  ['#updates', 'Aktualität und Änderungen'],
]

export function PageDatenschutz() {
  return (
    <>
      <h1>Datenschutzerklärung</h1>
      <TableOfContents items={tocItems} />
      <h2>Einleitung</h2>
      <p>
        Mit den nachfolgenden Informationen wollen wir Ihnen einen Überblick über die Verarbeitung
        Ihrer personenbezogenen Daten auf unserer Website tilda-geo.de (zuvor radverkehrsatlas.de)
        (nachfolgend „Website“ genannt) geben. Wir wollen Ihnen ebenfalls über eure Rechte aus dem
        Datenschutzrecht informieren. Die Verarbeitung Ihrer personenbezogenen Daten durch uns
        erfolgt stets im Einklang mit der Datenschutzgrundverordnung (nachfolgend „DSGVO“ genannt)
        sowie allen geltenden landesspezifischen Datenschutzbestimmungen.
      </p>
      <h2 id="responsible">Verantwortlichkeit</h2>
      <h3>Verantwortlich im Sinne der DSGVO</h3>
      <p>
        <strong>FixMyCity GmbH</strong>
        <br />
        Oberlandstraße 26-35
        <br />
        12099 Berlin
        <br />
        E-Mail: <LinkMail>hello@fixmycity.de</LinkMail>
        <br />
        Telefon: <LinkTel tel="+403054908665">+40 30 549 08 665</LinkTel>
      </p>
      <h3>Datenschutzbeauftragter</h3>
      <p>Unsere Datenschutzbeauftragten erreichen Sie wie folgt:</p>
      <p>
        <strong>secjur GmbH</strong>
        <br />
        Niklas Hanitsch
        <br />
        Steinhöft 9<br />
        20459 Hamburg
        <br />
        E-Mail: <LinkMail>dsb@secjur.com</LinkMail>
        <br />
        Telefon: <LinkTel tel="+4940228599520">+49 40 228 599 520</LinkTel>
      </p>
      <p>
        Sie können sich jederzeit bei allen Fragen und Anregungen zum Datenschutz sowie zur Ausübung
        Ihrer Rechte direkt an unsere Datenschutzbeauftragten wenden.
      </p>
      <h3>Einsatz von Drittdiensten</h3>
      <p>
        Für bestimmte Funktionen und Services auf unserer Website setzen wir Dienste von
        Drittanbietern ein. Die konkreten Dienste können jeweils den entsprechenden Kapiteln
        entnommen werden.
      </p>
      <p>
        Teilweise setzen wir Dienstleister ein, die ihren Sitz in einem Drittland haben, also
        außerhalb der EU. Wir übermitteln Daten nur in ein Drittland, in denen ein angemessenes
        Datenschutzniveau bzw. geeignete Garantien i. S. d. Art. 44-49 DSGVO vorliegen. Sie haben
        das Recht eine Kopie der von uns getroffenen geeigneten Garantien anzufordern. Schreiben Sie
        uns dazu gerne eine E-Mail an die in diesen Datenschutzhinweisen genannte E-Mail-Adresse.
      </p>

      <h2 id="hosting">Bereitstellung der Website</h2>

      <h3>Allgemeine Informationen</h3>

      <p>
        Bei Besuch unserer Website werden automatisch Daten verarbeitet, die Ihr Browser an unseren
        Server übermittelt. Diese allgemeinen Daten und Informationen werden in den Logfiles des
        Servers gespeichert (in sog. &bdquo;Server-Logfiles&ldquo;). Erfasst werden können die
      </p>
      <ul>
        <li>Browsertyp und Browserversion</li>
        <li>verwendetes Betriebssystem</li>
        <li>Referrer URL (zuvor besuchte Website)</li>
        <li>Hostname des zugreifenden Rechners</li>
        <li>Datum und Uhrzeit der Serveranfrage</li>
        <li>IP-Adresse</li>
      </ul>

      <h3>Zweck der Verarbeitung</h3>

      <p>
        Bei der Nutzung dieser allgemeinen Daten und Informationen ziehen wir keine Rückschlüsse auf
        Ihre Person. Zu den von uns verfolgten Zwecken gehört insbesondere:
      </p>
      <ul>
        <li>die Gewährleistung eines reibungslosen Verbindungsaufbaus der Website,</li>
        <li>die Aufklärung von Missbrauchs- oder Betrugshandlungen,</li>
        <li>Problemanalysen im Netzwerk, sowie</li>
        <li>die Auswertung der Systemsicherheit und -stabilität.</li>
      </ul>

      <h3>Rechtsgrundlage</h3>
      <p>
        Die Rechtsgrundlage für die Datenverarbeitung ist unser berechtigtes Interesse im Sinne des
        Art. 6 Abs. 1 S. 1 lit. f DSGVO. Wir haben ein überwiegendes berechtigtes Interesse daran,
        unser Angebot technisch einwandfrei anbieten zu können.
      </p>

      <h3>Speicherdauer</h3>
      <p>
        Die Logfiles werden aus Sicherheitsgründen (z.B. zur Aufklärung von Missbrauchs- oder
        Betrugshandlungen) für die Dauer von maximal 30 Tagen gespeichert und danach gelöscht.
        Daten, deren weitere Aufbewahrung zu Beweiszwecken erforderlich ist, werden bis zur
        endgültigen Klärung der Angelegenheit aufbewahrt.
      </p>

      <h3>Empfänger personenbezogener Daten</h3>
      <p>Wir setzen folgende Dienstleister ein:</p>
      <table>
        <thead>
          <tr>
            <th>Anbieter</th>
            <th>Anschrift</th>
            <th>Drittland</th>
            <th>Geeignete Garantie</th>
            <th>Zweck</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="align-text-top">Netlify, Inc.</th>
            <td>2325 3rd Street, Suite 215, San Francisco, 94107 CA</td>
            <td>USA</td>
            <td>Standarddatenschutzklauseln</td>
            <td>Hosting der Website und Bereitstellung der Inhalte</td>
          </tr>
          <tr>
            <th className="align-text-top">Amazon Web Services, Inc.</th>
            <td>410 Terry Avenue North, Seattle, WA 98109-5210</td>
            <td>USA</td>
            <td>Standarddatenschutzklauseln</td>
            <td>Hosting der Website und Bereitstellung der Inhalte</td>
          </tr>
          <tr>
            <th className="align-text-top">IONOS SE</th>
            <td>Elgendorfer Straße 57, 56410 Montabaur, Deutschland</td>
            <td>-</td>
            <td>-</td>
            <td>Hosting der Website und Bereitstellung der Inhalte</td>
          </tr>
          <tr>
            <th className="align-text-top">SCALEWAY</th>
            <td>8 rue de la Ville l&lsquo;Ev&ecirc;que, 75008 Paris, Frankreich</td>
            <td>-</td>
            <td>-</td>
            <td>Backup</td>
          </tr>
        </tbody>
      </table>

      <h2 id="youtube">YouTube</h2>

      <h3>Allgemeine Informationen</h3>
      <p>
        Wir binden Videos auf unserer Plattform ein, die bei YouTube gespeichert sind. Diese sind
        jedoch nicht automatisch verfügbar, sondern müssen erst durch aktive Bestätigung durch Sie
        freigegeben werden. Dabei können personenbezogene Daten an Google übertragen werden,
        beispielsweise Ihre IP-Adresse und weitere Nutzungsdaten.
      </p>

      <h3>Zweck der Verarbeitung</h3>
      <p>
        Der Zweck der Verarbeitung ist die Anzeige von Videos, die zum einen über das Angebot
        informieren und zum anderen die Nutzung des Angebots erklären sollen.
      </p>

      <h3>Rechtsgrundlage</h3>
      <p>
        Die Rechtsgrundlage für die Datenverarbeitung ist Ihre Einwilligung gem. Art. 6 Abs. 1 S. 1
        lit. a DSGVO.
      </p>

      <h3>Empfänger</h3>
      <p>
        Google Cloud EMEA Limited, 70 Sir John Rogerson's Quay, Dublin 2, Irland. Weiter
        Informationen erhalten Sie{' '}
        <Link blank href="https://policies.google.com/privacy?hl=de">
          in der Datenschutzerklärung von Google
        </Link>
        .
      </p>

      <h2 id="contact">Kontaktmöglichkeiten</h2>

      <h3>Allgemeine Informationen</h3>
      <p>
        Über unsere Website weisen wir auf die Möglichkeit hin, uns per E-Mail zu kontaktieren.Im
        Rahmen der Kontaktaufnahme und Beantwortung Ihrer Anfrage verarbeiten wir folgende
        personenbezogene Daten von Ihnen:
      </p>
      <ul>
        <li>Name</li>
        <li>E-Mail</li>
        <li>Datum und Zeit der Anfrage</li>
        <li>Meta-Daten der E-Mail</li>
        <li>
          Weitere personenbezogene Daten, die Sie uns im Rahmen der Kontaktaufnahme mitteilen.
        </li>
      </ul>

      <h3>Zweck der Verarbeitung</h3>
      <p>
        Wir verarbeiten Ihre Daten zur Beantwortung Ihrer Anfrage sowie andere daraus resultierende
        Sachverhalte.
      </p>

      <h3>Rechtsgrundlage</h3>
      <p>
        Wenn Ihre Anfrage unabhängig von vertraglichen oder vorvertraglichen Maßnahmen erfolgt,
        stellen unsere überwiegenden berechtigten Interessen gem. Art. 6 Abs. 1 S. 1 lit. f DSGVO
        die Rechtsgrundlage dar. Das überwiegende berechtigte Interesse liegt in der Notwendigkeit,
        geschäftliche Korrespondenz zu beantworten.
      </p>

      <h3>Speicherdauer</h3>
      <p>
        Wir löschen Ihre personenbezogenen Daten, sobald sie für die Erreichung des Zweckes der
        Erhebung nicht mehr erforderlich sind. Im Rahmen von Kontaktanfragen ist dies grundsätzlich
        dann der Fall, wenn sich aus den Umständen ergibt, dass der konkrete Sachverhalt
        abschließend bearbeitet ist. Darüber hinaus speichern wir E-Mails, sofern und solange sie
        gesetzlichen Aufbewahrungsfristen unterliegen.
      </p>

      <h2 id="newsletter">Newsletter</h2>

      <h3>Allgemeine Informationen</h3>
      <p>
        Wir bieten Ihnen die Möglichkeit, einen Newsletter zu erhalten. Mit unserem Newsletter
        informieren wir Kunden und Geschäftspartner in regelmäßigen Abständen über die
        Aktualisierung unseres Dienstes zu informieren.Im Rahmen des Newsletterversands verarbeiten
        wir folgende personenbezogene Daten:
      </p>
      <ul>
        <li>E-Mail-Adresse</li>
        <li>Vor- und Nachname</li>
        <li>Metadaten (z. B. Geräteinformationen, IP-Adresse, Datum- und Uhrzeit der Anmeldung)</li>
      </ul>

      <h2 id="rights">Ihre Rechte</h2>

      <h3>Recht auf Bestätigung</h3>
      <p>
        Sie haben das Recht, von uns eine Bestätigung darüber zu verlangen, ob Sie betreffende
        personenbezogene Daten verarbeitet werden.
      </p>

      <h3>Auskunft (Art. 15 DSGVO)</h3>
      <p>
        Sie haben das Recht, jederzeit von uns unentgeltliche Auskunft über die zu Ihrer Person
        gespeicherten personenbezogenen Daten sowie eine Kopie dieser Daten nach Maßgabe der
        gesetzlichen Bestimmungen zu erhalten.
      </p>

      <h3>Berichtigung (Art. 16 DSGVO)</h3>
      <p>
        Sie haben das Recht, die Berichtigung Sie betreffender unrichtiger personenbezogener Daten
        zu verlangen. Ferner steht Ihnen das Recht zu, unter Berücksichtigung der Zwecke der
        Verarbeitung, die Vervollständigung unvollständiger personenbezogener Daten zu verlangen.
      </p>

      <h3>Löschung (Art. 17 DSGVO)</h3>
      <p>
        Sie haben das Recht, von uns zu verlangen, dass personenbezogenen Daten, die sie betreffen,
        unverzüglich gelöscht werden, wenn einer der gesetzlich vorgesehenen Gründe zutrifft und
        soweit die Verarbeitung bzw. Speicherung nicht erforderlich ist.
      </p>

      <h3>Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
      <p>
        Sie haben das Recht, von uns die Einschränkung der Verarbeitung zu verlangen, wenn eine der
        gesetzlichen Voraussetzungen gegeben ist.
      </p>

      <h3>Datenübertragbarkeit (Art. 20 DSGVO)</h3>
      <p>
        Sie haben das Recht, die Sie betreffenden personenbezogenen Daten, die Sie uns
        bereitgestellt haben, in einem strukturierten, gängigen und maschinenlesbaren Format zu
        erhalten. Weiterhin haben Sie das Recht, diese Daten einem anderen Verantwortlichen ohne
        Behinderung durch uns, dem die personenbezogenen Daten bereitgestellt wurden, zu
        übermitteln, sofern die Verarbeitung auf der Einwilligung gem. Art. 6 Abs. 1 S. 1 lit. a
        DSGVO oder Art. 9 Abs. 2 lit. a DSGVO oder auf einem Vertrag gem. Art. 6 Abs. 1 S. 1 lit. b
        DSGVO beruht und die Verarbeitung mithilfe automatisierter Verfahren erfolgt, sofern die
        Verarbeitung nicht für die Wahrnehmung einer Aufgabe erforderlich ist, die im öffentlichen
        Interesse liegt oder in Ausübung öffentlicher Gewalt erfolgt, welche uns übertragen
        wurde.Zudem haben Sie bei der Ausübung Ihres Rechts auf Datenübertragbarkeit gem. Art. 20
        Abs. 1 DSGVO das Recht, zu erwirken, dass die personenbezogenen Daten direkt von einem
        Verantwortlichen an einen anderen Verantwortlichen übermittelt werden, soweit dies technisch
        machbar ist und sofern hiervon nicht die Rechte und Freiheiten anderer Personen
        beeinträchtigt werden.
      </p>

      <h3>Widerspruch (Art. 21 DSGVO)</h3>
      <p>
        <strong>
          Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben,
          jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten, die aufgrund
          einer Datenverarbeitung im öffentlichen Interesse gem. Art. 6 Abs. 1 S. 1 lit. e DSGVO
          oder auf Grundlage unseres berechtigten Interesses gem. Art. 6 Abs. 1 S. 1 lit. f DSGVO
          erfolgt, Widerspruch einzulegen
        </strong>
        . Legen Sie Widerspruch ein, werden wir Ihre personenbezogenen Daten nicht mehr verarbeiten,
        es sei denn, wir können zwingende berechtigte Gründe für die Verarbeitung nachweisen, die
        Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der
        Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.
      </p>

      <h3>Widerruf einer datenschutzrechtlichen Einwilligung</h3>
      <p>
        Sie haben das Recht, Ihre Einwilligung zur Verarbeitung personenbezogener Daten jederzeit
        mit Wirkung für die Zukunft zu widerrufen.
      </p>

      <h3>Beschwerde bei einer Aufsichtsbehörde</h3>
      <p>
        Sie haben das Recht, sich bei einer für Datenschutz zuständigen Aufsichtsbehörde über unsere
        Verarbeitung personenbezogener Daten zu beschweren.
      </p>

      <h2 id="updates">Aktualität und Änderungen der Datenschutzhinweise</h2>
      <p>
        Diese Datenschutzhinweise sind aktuell gültig und hat den folgenden Stand: November 2022.
      </p>
      <p>
        Wenn wir unsere Website und unsere Angebote weiterentwickeln oder sich gesetzliche oder
        behördliche Vorgaben ändern, kann es notwendig sein, diese Datenschutzhinweise zu ändern.
        Die jeweils aktuellen Datenschutzhinweise können Sie jederzeit hier abrufen.
      </p>
    </>
  )
}
