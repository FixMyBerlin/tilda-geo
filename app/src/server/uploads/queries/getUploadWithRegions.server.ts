import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { parseMapDatasetUploadConfigs } from '@/server/uploads/mapDatasetUploadConfigs.schema'
import { parseMapDatasetUploadStyleGroups } from '@/server/uploads/mapDatasetUploadStyleGroups'
import { GetUploadSchema } from '../schema'

export async function getUploadWithRegions(input: { slug: string }, headers: Headers) {
  await requireAdmin(headers)
  const { slug } = GetUploadSchema.parse(input)

  const upload = await db.mapDatasetUpload.findFirstOrThrow({
    where: { slug },
    include: {
      regions: { select: { id: true, slug: true } },
      // Layer-config rows power the admin detail "Ansichten" table.
      layerConfigs: { orderBy: [{ subId: 'asc' }, { id: 'asc' }] },
    },
  })

  // Layer-config rows have no style group; it lives on `configs[].styleGroup` and `styleGroups`.
  const configs = parseMapDatasetUploadConfigs(upload.configs)
  const styleGroups = parseMapDatasetUploadStyleGroups(upload.styleGroups)
  const styleGroupName = (subId: string | null) => {
    const config = configs.find((entry) => (entry.subId ?? null) === subId)
    return styleGroups.find(({ id }) => id === config?.styleGroup)?.name ?? null
  }

  return {
    ...upload,
    layerConfigs: upload.layerConfigs.map((layerConfig) => ({
      ...layerConfig,
      styleGroupName: styleGroupName(layerConfig.subId),
    })),
  }
}
