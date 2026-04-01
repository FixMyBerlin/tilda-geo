export const createSourceKeyStaticDatasets = (sourceId: string, subId: string | undefined) => {
  return [sourceId, subId].filter(Boolean).join('--')
}

export const parseSourceKeyStaticDatasets = (key: string) => {
  const [sourceId, subId] = key.split('--')
  return { sourceId, subId } as { sourceId: string; subId: string | undefined }
}

export const createDatasetSourceLayerKey = (
  sourceId: string,
  subId: string | undefined,
  layerId: string,
) => {
  return [sourceId, subId, layerId].filter(Boolean).join('--')
}
