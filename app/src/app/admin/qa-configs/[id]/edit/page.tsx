'use client'
import { Breadcrumb } from '@/src/app/admin/_components/Breadcrumb'
import { HeaderWrapper } from '@/src/app/admin/_components/HeaderWrapper'
import { ObjectDump } from '@/src/app/admin/_components/ObjectDump'
import { FORM_ERROR, QaConfigForm } from '@/src/app/admin/qa-configs/_components/QaConfigForm'
import updateQaConfig from '@/src/server/qa-configs/mutations/updateQaConfig'
import getQaConfig from '@/src/server/qa-configs/queries/getQaConfig'
import { useMutation, useQuery } from '@blitzjs/rpc'
import { useParams, useRouter } from 'next/navigation'
import { z } from 'zod'

// Define the form input schema (what the form actually receives)
const QaConfigFormInputSchema = z.object({
  slug: z.string(),
  label: z.string(),
  isActive: z.string(),
  mapTable: z.string(),
  mapAttribution: z.string().optional(),
  goodThreshold: z.string(),
  needsReviewThreshold: z.string(),

  regionId: z.string(),
})

export default function AdminEditQaConfigPage() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params?.id as string)

  const [qaConfig] = useQuery(
    getQaConfig,
    { id },
    {
      staleTime: Infinity,
    },
  )
  const [updateQaConfigMutation] = useMutation(updateQaConfig)

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/qa-configs', name: 'QA Konfigurationen' },
            { href: `/admin/qa-configs/${id}/edit`, name: 'Bearbeiten' },
          ]}
        />
      </HeaderWrapper>

      <ObjectDump data={qaConfig} className="my-10" />

      <QaConfigForm
        submitText="QA Konfiguration aktualisieren"
        schema={QaConfigFormInputSchema}
        initialValues={{
          slug: qaConfig.slug,
          label: qaConfig.label,
          isActive: qaConfig.isActive ? 'true' : 'false',
          mapTable: qaConfig.mapTable,
          mapAttribution: qaConfig.mapAttribution || '',
          goodThreshold: qaConfig.goodThreshold.toString(),
          needsReviewThreshold: qaConfig.needsReviewThreshold.toString(),

          regionId: qaConfig.regionId.toString(),
        }}
        onSubmit={async (values) => {
          try {
            await updateQaConfigMutation({
              id: qaConfig.id,
              slug: values.slug,
              label: values.label,
              isActive: values.isActive === 'true',
              mapTable: values.mapTable,
              mapAttribution: values.mapAttribution || '',
              goodThreshold: parseFloat(values.goodThreshold),
              needsReviewThreshold: parseFloat(values.needsReviewThreshold),

              regionId: parseInt(values.regionId),
            })
            router.refresh()
            router.push('/admin/qa-configs')
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

AdminEditQaConfigPage.authenticate = { role: 'ADMIN' }
