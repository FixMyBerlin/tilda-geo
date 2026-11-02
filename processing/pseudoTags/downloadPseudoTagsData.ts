import { downloadInfraveloNetz } from './infraveloNetzSource/download'
import { downloadMapillaryCoverage } from './mapillaryCoverageSource/download'

export const downloadPseudoTagsData = async () => {
  await downloadMapillaryCoverage()
  await downloadInfraveloNetz()

  return true
}
