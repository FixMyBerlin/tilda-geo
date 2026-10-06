import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import { adminBulletedListClassName, adminCardClassName } from '@/components/admin/adminClasses'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTableActions, AdminTableDeleteButton } from '@/components/admin/AdminTableActions'
import { McpCursorConfigPreview } from '@/components/admin/api-tokens/McpCursorConfigPreview'
import { PageApiTokensMcpSetup } from '@/components/admin/api-tokens/PageApiTokensMcpSetup'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import { Pill } from '@/components/shared/text/Pill'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import {
  createAdminApiTokenFn,
  revokeAdminApiTokenFn,
} from '@/server/admin/adminApiTokens.functions'
import { buildMcpCursorConfigJson, mcpEnvLabel } from '@/server/mcp/mcpCursorConfig'

const routeApi = getRouteApi('/admin/api-tokens')

// Env + origin for the MCP config are derivable client-side from the VITE-exposed env.
const mcpServerEnvLabel = mcpEnvLabel(import.meta.env.VITE_APP_ENV)
const mcpServerOrigin = import.meta.env.VITE_APP_ORIGIN

const CreateApiTokenSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
})

const tokenHeader = [
  'Name',
  'Erstellt von',
  'Erstellt',
  'Zuletzt genutzt',
  'Status',
  { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' as const },
]

export function PageApiTokens() {
  const { tokens } = routeApi.useLoaderData()
  const router = useRouter()
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const createdMcpConfigJson = createdToken
    ? buildMcpCursorConfigJson({
        envLabel: mcpServerEnvLabel,
        origin: mcpServerOrigin,
        apiToken: createdToken,
      })
    : null

  const revokeToken = useMutation({
    mutationFn: async (id: string) => {
      await revokeAdminApiTokenFn({ data: { id } })
    },
    onSuccess: async () => {
      await router.invalidate()
      toastSuccess('Widerrufen.')
    },
  })

  return (
    <>
      <AdminPageHeader title="API-Tokens (MCP)" />

      <PageApiTokensMcpSetup envLabel={mcpServerEnvLabel} origin={mcpServerOrigin} />

      <section
        aria-labelledby="new-api-token-title"
        className={twJoin(adminCardClassName, 'mb-6 p-4 sm:p-6')}
      >
        <h2 id="new-api-token-title" className="mb-4 text-base/7 font-semibold text-gray-900">
          Neuer Token
        </h2>
        <Form
          schema={CreateApiTokenSchema}
          defaultValues={{ name: '' }}
          submitLabel="Token erstellen"
          onSubmit={async ({ name }) => {
            try {
              const result = await createAdminApiTokenFn({ data: { name } })
              setCreatedToken(result.token)
              await router.invalidate()
              return { success: true, message: 'Erstellt.', resetValues: { name: '' } }
            } catch (error) {
              return {
                success: false,
                message:
                  error instanceof Error ? error.message : 'Token konnte nicht erstellt werden.',
              }
            }
          }}
        >
          {(form) => (
            <TextField form={form} name="name" label="Name" placeholder="z. B. mcp-laptop-tobias" />
          )}
        </Form>

        {createdMcpConfigJson ? (
          <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm">
            <p className="mb-3 font-medium text-green-900">
              Neuer Token — fertige MCP-Konfiguration jetzt kopieren (wird nicht erneut angezeigt):
            </p>
            <McpCursorConfigPreview
              configJson={createdMcpConfigJson}
              copyLabel="MCP-Konfiguration kopieren"
              variant="success"
            />
          </div>
        ) : null}
      </section>

      {tokens.length === 0 ? (
        <AdminEmptyState>Noch keine Tokens vorhanden.</AdminEmptyState>
      ) : (
        <AdminTable header={tokenHeader}>
          {tokens.map((token) => (
            <tr key={token.id}>
              <th scope="row" className={adminTableClasses.thRow}>
                {token.name}
              </th>
              <td className={adminTableClasses.td}>
                {token.createdBy.osmName ||
                  [token.createdBy.firstName, token.createdBy.lastName].filter(Boolean).join(' ') ||
                  token.createdBy.email ||
                  '—'}
              </td>
              <td className={adminTableClasses.td}>
                {token.createdAt ? formatDateTimeBerlin(token.createdAt) : '—'}
              </td>
              <td className={adminTableClasses.td}>
                {token.lastUsedAt ? formatDateTimeBerlin(token.lastUsedAt) : '—'}
              </td>
              <td className={adminTableClasses.td}>
                {token.revokedAt ? (
                  <Pill color="red">Widerrufen</Pill>
                ) : (
                  <Pill color="green">Aktiv</Pill>
                )}
              </td>
              <td className={adminTableClasses.td}>
                <AdminTableActions>
                  {token.revokedAt ? null : (
                    <AdminTableDeleteButton
                      label={`Token ${token.name} widerrufen`}
                      title={`Token „${token.name}“ widerrufen?`}
                      description="Bereits ausgestellte Konfigurationen mit diesem Token funktionieren danach nicht mehr."
                      confirmLabel="Widerrufen"
                      onDelete={() => revokeToken.mutateAsync(token.id)}
                    />
                  )}
                </AdminTableActions>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <ul className={twJoin(adminBulletedListClassName, 'mt-3 text-sm text-gray-600')}>
        <li>
          <span className="inline-flex items-center gap-2">
            <Pill color="green">Aktiv</Pill>
            <span>Token ist gültig und autorisiert API-/MCP-Requests.</span>
          </span>
        </li>
        <li>
          <span className="inline-flex items-center gap-2">
            <Pill color="red">Widerrufen</Pill>
            <span>
              Token wurde manuell von einem Admin unwiderruflich deaktiviert und lehnt Requests ab
              (z. B. nach Verlust oder Ende der Nutzung).
            </span>
          </span>
        </li>
      </ul>
    </>
  )
}
