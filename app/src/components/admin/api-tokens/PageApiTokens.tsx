import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { RevokeApiTokenButton } from '@/components/admin/api-tokens/RevokeApiTokenButton'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { adminHeaderActionButtonClassName, HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { buttonStyles } from '@/components/shared/links/styles'
import { Pill } from '@/components/shared/text/Pill'
import { toastError } from '@/components/shared/toast/toastError'
import { createAdminApiTokenFn } from '@/server/admin/adminApiTokens.functions'
import { buildMcpCursorConfigJson, mcpEnvLabel } from '@/server/mcp/mcpCursorConfig'
import { McpCursorConfigPreview } from './McpCursorConfigPreview'
import { PageApiTokensMcpSetup } from './PageApiTokensMcpSetup'

const routeApi = getRouteApi('/admin/api-tokens')

// Env + origin for the MCP config are derivable client-side from the VITE-exposed env.
const mcpServerEnvLabel = mcpEnvLabel(import.meta.env.VITE_APP_ENV)
const mcpServerOrigin = import.meta.env.VITE_APP_ORIGIN

export function PageApiTokens() {
  const { tokens } = routeApi.useLoaderData()
  const router = useRouter()
  const [name, setName] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const createdMcpConfigJson = createdToken
    ? buildMcpCursorConfigJson({
        envLabel: mcpServerEnvLabel,
        origin: mcpServerOrigin,
        apiToken: createdToken,
      })
    : null

  const { mutate: createToken, isPending } = useMutation({
    mutationFn: (tokenName: string) => createAdminApiTokenFn({ data: { name: tokenName } }),
    onSuccess: async (result) => {
      setCreatedToken(result.token)
      setName('')
      await router.invalidate()
    },
    onError: (error) => toastError(error, 'Token konnte nicht erstellt werden'),
  })

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || isPending) return
    createToken(trimmed)
  }

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/api-tokens', name: 'API-Tokens' }]} />
      </HeaderWrapper>

      <PageApiTokensMcpSetup envLabel={mcpServerEnvLabel} origin={mcpServerOrigin} />

      <form onSubmit={handleCreate} className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="z. B. mcp-laptop-tobias"
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className={twMerge(buttonStyles, adminHeaderActionButtonClassName)}
        >
          {isPending ? 'Wird erstellt…' : 'Token erstellen'}
        </button>
      </form>

      {createdMcpConfigJson ? (
        <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-3 text-sm">
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

      <AdminTable
        header={[
          'Name',
          'Erstellt von',
          'Erstellt',
          'Zuletzt genutzt',
          'Status',
          { id: 'actions', label: '' },
        ]}
      >
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
              {token.revokedAt ? null : (
                <RevokeApiTokenButton tokenId={token.id} tokenName={token.name} />
              )}
            </td>
          </tr>
        ))}
      </AdminTable>

      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
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
