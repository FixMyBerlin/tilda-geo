import { downloadCyclewayOnewayCorrections } from './cyclewayOnewayCorrectionsSource/download'
import { downloadInfraveloNetz } from './infraveloNetzSource/download'
import { downloadMapillaryCoverage } from './mapillaryCoverageSource/download'

export const downloadPseudoTagsData = async () => {
  await downloadMapillaryCoverage()
  await downloadInfraveloNetz()
  await downloadCyclewayOnewayCorrections()

  return true
}
