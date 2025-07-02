import { LabeledRadiobuttonProps } from '@/src/app/_components/forms/LabeledRadiobutton'

export const getRegionSelectOptions = (regions: any) => {
  const result: Omit<LabeledRadiobuttonProps, 'scope'>[] = []
  regions.forEach((p: any) => {
    result.push({
      value: String(p.id),
      label: p.name,
      // help: p.fullName,
    })
  })
  return result
}
