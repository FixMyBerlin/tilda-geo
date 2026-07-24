export function buildRegionContractsListSearch(contract?: string) {
  const value = contract?.trim()
  if (!value) return { contract: undefined }
  return { contract: value }
}
