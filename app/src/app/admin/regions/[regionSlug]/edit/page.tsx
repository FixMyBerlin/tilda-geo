'use client'
import { linkStyles } from '@/src/app/_components/links/styles'
import { Breadcrumb } from '@/src/app/admin/_components/Breadcrumb'
import { HeaderWrapper } from '@/src/app/admin/_components/HeaderWrapper'
import { ObjectDump } from '@/src/app/admin/_components/ObjectDump'
import { RegionStatusPill } from '@/src/app/admin/_components/RegionStatusPill'
import { FORM_ERROR, RegionForm } from '@/src/app/admin/regions/_components/RegionForm'
import { useRegionSlug } from '@/src/app/regionen/[regionSlug]/_components/regionUtils/useRegionSlug'
import updateRegion from '@/src/server/regions/mutations/updateRegion'
import getRegion from '@/src/server/regions/queries/getRegion'
import { RegionFormSchema } from '@/src/server/regions/schemas'
import deleteUser from '@/src/server/users/mutations/deleteUser'
import getUsersForRegion from '@/src/server/users/queries/getUsersForRegion'
import { useMutation, useQuery } from '@blitzjs/rpc'
import { Route } from 'next'
import { useRouter } from 'next/navigation'

export default function AdminEditRegionPage() {
  const router = useRouter()
  const regionSlug = useRegionSlug()!
  const [region] = useQuery(
    getRegion,
    { slug: regionSlug },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    },
  )
  const [updateRegionMutation] = useMutation(updateRegion)
  const [users] = useQuery(getUsersForRegion, { regionSlug })
  const [deleteUserMutation] = useMutation(deleteUser)

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm(`Benutzer mit ID ${userId} unwiderruflich löschen?`)) {
      try {
        await deleteUserMutation({ userId })
        router.refresh()
      } catch (error: any) {
        window.alert(error.toString())
        console.error(error)
      }
    }
  }

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/regions', name: 'Regionen' },
            // TS: No idea why this "as" is needed. `regionSlug` is a simple string so it should work.
            { href: `/admin/regions/${regionSlug}/edit` as Route, name: 'Bearbeiten' },
          ]}
        />
      </HeaderWrapper>

      <ObjectDump data={region} className="my-10" />

      <div className="my-10">
        <h2 className="mb-4 text-xl font-semibold">Benutzer dieser Region</h2>
        {users.length === 0 ? (
          <p className="text-gray-500">Keine Benutzer gefunden</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold sm:pl-6"
                >
                  Benutzer
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                  Regionen
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-4 pr-3 pl-4 text-sm sm:pl-6">
                    <strong>OSM: {user.osmName}</strong> ({user.osmId})
                    <br />
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : '–'}
                    <br />
                    {user.email || '–'}
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <ul className="list-inside list-disc">
                      {user.Membership.map((membership) => (
                        <li key={membership.id} className="flex items-center gap-2">
                          <span>{membership.region.slug}</span>
                          <RegionStatusPill status={membership.region.status} className="text-xs" />
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <button onClick={() => handleDeleteUser(user.id)} className={linkStyles}>
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RegionForm
        submitText="Update Region"
        schema={RegionFormSchema}
        initialValues={{
          ...region,
          // @ts-expect-error the Form (and RegionFormSchema) require a string
          promoted: String(!!region.promoted),
          status: region.status,
        }}
        onSubmit={async (values) => {
          try {
            await updateRegionMutation({
              ...values,
              slug: region.slug,
            })
            router.refresh()
            router.push('/admin/regions')
          } catch (error: any) {
            console.error(error)
            return {
              [FORM_ERROR]: error.toString(),
            }
          }
        }}
      />
    </>
  )
}

AdminEditRegionPage.authenticate = { role: 'ADMIN' }
