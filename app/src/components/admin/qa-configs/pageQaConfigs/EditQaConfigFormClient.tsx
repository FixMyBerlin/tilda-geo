import { updateQaConfigFn } from '@/server/qa-configs/qa-configs.functions'
import { UpdateQaConfigFormSchema } from '@/server/qa-configs/schemas'
import { QaConfigForm } from './QaConfigForm'

type Props = {
  qaConfig: {
    id: number
    slug: string
    label: string
    isActive: boolean
    mapTable: string
    mapAttribution: string | null
    goodThreshold: number
    needsReviewThreshold: number
    absoluteDifferenceThreshold: number
    regionId: number
  }
  regions: Array<{ id: number; slug: string }>
}

export function EditQaConfigFormClient({ qaConfig, regions }: Props) {
  return (
    <QaConfigForm
      schema={UpdateQaConfigFormSchema}
      defaultValues={{
        id: qaConfig.id,
        slug: qaConfig.slug,
        label: qaConfig.label,
        isActive: qaConfig.isActive ? 'true' : 'false',
        mapTable: qaConfig.mapTable,
        mapAttribution: qaConfig.mapAttribution ?? '',
        goodThreshold: qaConfig.goodThreshold.toString(),
        needsReviewThreshold: qaConfig.needsReviewThreshold.toString(),
        absoluteDifferenceThreshold: qaConfig.absoluteDifferenceThreshold.toString(),
        regionId: qaConfig.regionId.toString(),
      }}
      submitLabel="QA Konfiguration aktualisieren"
      regions={regions}
      onSubmit={async (values) => updateQaConfigFn({ data: values })}
    />
  )
}
