'use client'
import { FORM_ERROR, RegionForm } from '@/src/app/admin/regions/_components/RegionForm'
import createRegion from '@/src/server/regions/mutations/createRegion'
import { RegionFormSchema } from '@/src/server/regions/schemas'
import { useMutation } from '@blitzjs/rpc'
import { useRouter, useSearchParams } from 'next/navigation'
import { Breadcrumb } from '../../_components/Breadcrumb'
import { HeaderWrapper } from '../../_components/HeaderWrapper'

export default function AdminRegionNewPage() {
  const router = useRouter()
  const searchParamSlug = useSearchParams()?.get('slug') || undefined
  const [createRegionMutation] = useMutation(createRegion)

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/regions', name: 'Regionen' },
            { href: '/admin/regions/new', name: 'Anlegen' },
          ]}
        />
      </HeaderWrapper>

      <RegionForm
        submitText="Region anlegen"
        schema={RegionFormSchema}
        initialValues={{
          slug: searchParamSlug,
          // @ts-expect-error the Form (and RegionFormSchema) require a string
          promoted: 'false',
          status: 'PUBLIC',
        }}
        onSubmit={async (values) => {
          try {
            await createRegionMutation(values)
            router.refresh()
            router.push(`/admin/regions`)
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

AdminRegionNewPage.authenticate = true
