import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { MarkdownMail } from './templates/MarkdownMail'
import { getDomain } from './utils/getDomain'
import { sendMail } from './utils/sendMail'

const NOTIFICATION_EMAIL = 'tilda@fixmycity.de'

type User = {
  id: string
  osmId: number
  osmName: string | null
  osmDescription: string | null
  email: string
  createdAt: Date
}

type NewUserRegistrationMailer = {
  user: User
}

function buildMailContent(user: User) {
  const baseUrl = getDomain()
  const adminMembershipsUrl = `${baseUrl}/admin/memberships`
  const createMembershipUrl = `${baseUrl}/admin/memberships/new?userId=${user.id}`

  const registrationDate = formatDateTimeBerlin(user.createdAt)

  const introMarkdown = `
# Neue Benutzerregistrierung

## Benutzerinformationen

* **Benutzer-ID:** ${user.id}
* **OSM-ID:** ${user.osmId}
* **OSM-Name:** ${user.osmName || 'N/A'}
* **OSM-Beschreibung:** ${user.osmDescription || 'N/A'}
* **E-Mail:** ${user.email}
* **Registrierungsdatum:** ${registrationDate}

## Registrierungsdetails

* **Region:** Zum Zeitpunkt der Registrierung nicht verfügbar
`

  return {
    introMarkdown,
    ctaLink: createMembershipUrl,
    ctaText: 'Mitgliedschaft für diesen Benutzer erstellen',
    outroMarkdown: `[Alle Mitgliedschaften anzeigen](${adminMembershipsUrl})`,
  }
}

export function newUserRegistrationMailer({ user }: NewUserRegistrationMailer) {
  const content = buildMailContent(user)

  const message = {
    From: {
      Email: 'noreply@tilda-geo.de',
      Name: 'TILDA Geo',
    },
    To: [
      {
        Email: NOTIFICATION_EMAIL,
      },
    ],
    Subject: `Neue Benutzerregistrierung: ${user.osmName || 'Unbekannt'}`,
    ...content,
  }

  return {
    async send() {
      await sendMail(message)
    },
  }
}

// React component for preview in react-email dev server
const demoUser: User = {
  id: 'clx1234567890',
  osmId: 456789,
  osmName: 'Max Mustermann',
  osmDescription: 'OpenStreetMap contributor since 2015',
  email: 'max.mustermann@example.com',
  createdAt: new Date('2024-01-15T10:30:00Z'),
}

export default function NewUserRegistrationMailer() {
  const content = buildMailContent(demoUser)

  return <MarkdownMail {...content} />
}
