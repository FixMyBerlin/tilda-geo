'use client'
import { Breadcrumb } from '@/src/app/admin/_components/Breadcrumb'
import { HeaderWrapper } from '@/src/app/admin/_components/HeaderWrapper'
import { FORM_ERROR, QaConfigForm } from '@/src/app/admin/qa-configs/_components/QaConfigForm'
import createQaConfig from '@/src/server/qa-configs/mutations/createQaConfig'

import { useMutation } from '@blitzjs/rpc'
import { useRouter } from 'next/navigation'
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

export default function AdminNewQaConfigPage() {
  const router = useRouter()
  const [createQaConfigMutation] = useMutation(createQaConfig)

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/qa-configs', name: 'QA Konfigurationen' },
            { href: '/admin/qa-configs/new', name: 'Neue QA Konfiguration' },
          ]}
        />
      </HeaderWrapper>

      <QaConfigForm
        submitText="QA Konfiguration erstellen"
        schema={QaConfigFormInputSchema}
        initialValues={{
          slug: '',
          label: '',
          isActive: 'true',
          mapTable: '',
          mapAttribution: '',
          goodThreshold: '0.1',
          needsReviewThreshold: '0.2',

          regionId: '',
        }}
        onSubmit={async (values) => {
          try {
            await createQaConfigMutation({
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

AdminNewQaConfigPage.authenticate = { role: 'ADMIN' }
