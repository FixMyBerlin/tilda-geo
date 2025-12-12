import { downloadMapillaryCoverage } from './mapillaryCoverageSource/download'

export const downloadPseudoTagsData = async () => {
  await downloadMapillaryCoverage()

  return true
}
