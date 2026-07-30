import { Disclosure } from '@/components/regionen/pageRegionSlug/SidebarInspector/Disclosure/Disclosure'
import { Link } from '@/components/shared/links/Link'
import { adminMcpCursorDocsUrl, adminMcpRemoteServersDocsUrl } from '@/content/adminMcpSetup'
import { buildMcpCursorConfigJson, type McpEnvLabel } from '@/server/mcp/mcpCursorConfig'
import { McpCursorConfigPreview } from './McpCursorConfigPreview'

const stepListClassName = 'list-decimal space-y-2 pl-5'

type PageApiTokensMcpSetupProps = {
  envLabel: McpEnvLabel
  origin: string
}

export function PageApiTokensMcpSetup({ envLabel, origin }: PageApiTokensMcpSetupProps) {
  const placeholderConfigJson = buildMcpCursorConfigJson({ envLabel, origin })
  const serverName = `tilda-geo-admin--${envLabel}`

  return (
    <div className="mb-6 max-w-prose space-y-4 text-sm text-gray-600">
      <p>
        Bearer-Tokens autorisieren die Admin-REST-API (<code>GET/POST/PUT/DELETE /api/admin/*</code>
        ) und den <strong>Remote-MCP-Server</strong> unter <code>{origin}/mcp</code>. Der Token-Wert
        wird nur einmal beim Erstellen angezeigt. Ein aktiver Token erlaubt vollen Region-CRUD und
        Audit-Log-Lesen — bei Verlust oder Ende der Nutzung widerrufen.
      </p>

      <Disclosure title="MCP einrichten (Cursor, Claude & Co.)" defaultOpen={false}>
        <div className="space-y-5 p-4 text-sm text-gray-700">
          <section className="space-y-2">
            <p>
              Der MCP-Server ist der HTTP-Endpunkt <code>{origin}/mcp</code> der laufenden App.
              Cursor verbindet sich per URL; die Authentifizierung erfolgt über den Bearer-Token im
              Header. Der Eintrag heißt <code>{serverName}</code> (<strong>{envLabel}</strong>
              -Umgebung), damit du DEV/STG/PRD parallel registrieren und auseinanderhalten kannst.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900">Cursor</h3>
            <ol className={stepListClassName}>
              <li>
                Unten einen Token erstellen — die fertige Konfiguration mit echtem Token erscheint
                dann direkt darüber (wird nicht erneut angezeigt).
              </li>
              <li>
                <strong>MCP-Einstellungen öffnen:</strong> Befehlsleiste (<kbd>Cmd+Shift+P</kbd> /{' '}
                <kbd>Ctrl+Shift+P</kbd>), <code>mcp</code> eingeben,{' '}
                <strong>View: Open MCP Settings</strong> wählen. Konfiguration global in{' '}
                <code>~/.cursor/mcp.json</code> oder projektbezogen in <code>.cursor/mcp.json</code>{' '}
                — Details in der{' '}
                <Link blank href={adminMcpCursorDocsUrl}>
                  Cursor MCP-Dokumentation
                </Link>
                .
              </li>
              <li>
                Den <code>mcpServers</code>-Block aus dem Beispiel unten (bzw. die fertige Variante
                mit echtem Token oben) übernehmen.
              </li>
              <li>MCP-Server neu laden bzw. Cursor neu starten.</li>
              <li>
                Im Chat z. B. „Liste alle Regionen“ fragen — Cursor ruft Tools wie{' '}
                <code>regions_list</code> auf. Mit <code>env_info</code> prüfen, auf welche Umgebung
                der Server zeigt, <strong>bevor</strong> du schreibst.
              </li>
            </ol>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900">Mehrere Umgebungen (DEV/STG/PRD)</h3>
            <p>
              Pro Umgebung gibt es eine eigene Admin-Seite und damit eine eigene Konfiguration (
              <code>tilda-geo-admin--DEV</code>, <code>--STG</code>, <code>--PRD</code>). Alle drei{' '}
              <code>mcpServers</code>-Einträge nebeneinander einfügen und je nach Aufgabe den
              passenden Server wählen; <code>env_info</code> bzw. der Servername zeigt die Umgebung.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900">Claude &amp; andere MCP-Clients</h3>
            <p>
              Clients mit Remote-MCP (HTTP) nutzen dieselbe <code>mcpServers</code>-Struktur mit{' '}
              <code>url</code> + <code>headers</code> wie im Beispiel — nur Speicherort und UI
              unterscheiden sich. Anleitung:{' '}
              <Link blank href={adminMcpRemoteServersDocsUrl}>
                MCP: Connect to remote servers
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900">REST-API direkt (ohne MCP)</h3>
            <p>
              Header <code>Authorization: Bearer &lt;token&gt;</code> bei jedem Request, z. B.{' '}
              <code>GET {origin}/api/admin/regions</code>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900">Beispiel-Konfiguration ({envLabel})</h3>
            <p>
              Platzhalter-Token — nach dem Erstellen eines Tokens oben die fertige Variante mit
              echtem Wert kopieren.
            </p>
            <McpCursorConfigPreview configJson={placeholderConfigJson} />
          </section>
        </div>
      </Disclosure>
    </div>
  )
}
