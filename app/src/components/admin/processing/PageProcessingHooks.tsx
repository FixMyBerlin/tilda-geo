import { AdminIntro } from '@/components/admin/AdminIntro'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ProcessingPrivateHooksSection } from './ProcessingPrivateHooksSection'

export function PageProcessingHooks() {
  return (
    <>
      <AdminPageHeader
        title="Pipeline-Hooks"
        intro={
          <AdminIntro>
            <p>
              Manuelle Auslöser für Schritte, die sonst automatisch nach dem Processing laufen –
              dieselben Endpunkte, der API-Key steckt serverseitig. Vor der Statistik zuerst die
              SQL-Funktionen registrieren.
            </p>
          </AdminIntro>
        }
      />
      <ProcessingPrivateHooksSection />
    </>
  )
}
