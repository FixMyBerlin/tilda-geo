import { createQaConfigFn } from '@/server/qa-configs/qa-configs.functions'
import { CreateQaConfigFormSchema } from '@/server/qa-configs/schemas'
import { QaConfigForm, QaConfigFormInputSchema } from './QaConfigForm'

type Props = {
  regions: Array<{ id: number; slug: string }>
}

export function QaConfigFormWrapper({ regions }: Props) {
  return (
    <QaConfigForm
      schema={CreateQaConfigFormSchema}
      defaultValues={{
        slug: QaConfigFormInputSchema.slug,
        label: QaConfigFormInputSchema.label,
        isActive: QaConfigFormInputSchema.isActive,
        mapTable: QaConfigFormInputSchema.mapTable,
        mapAttribution: QaConfigFormInputSchema.mapAttribution,
        goodThreshold: QaConfigFormInputSchema.goodThreshold,
        needsReviewThreshold: QaConfigFormInputSchema.needsReviewThreshold,
        absoluteDifferenceThreshold: QaConfigFormInputSchema.absoluteDifferenceThreshold,
        regionId: QaConfigFormInputSchema.regionId,
      }}
      submitLabel="QA Konfiguration erstellen"
      regions={regions}
      onSubmit={async (values) => createQaConfigFn({ data: values })}
    />
  )
}
