import { ModeCollectionSelect } from '../ModeCollectionSelect'
import type { SpaceFinderCollectionOption } from './spaceFinderCollectionOptions'

type Props = {
  options: SpaceFinderCollectionOption[]
  selectedVariantId: number | undefined
  onSelect: (variantId: number) => void
}

/** Flat Gebiet/Variante options for the mode header disclosure (D4). */
export const SpaceFinderSelect = ({ options, selectedVariantId, onSelect }: Props) => {
  if (options.length === 0) {
    return <p className="px-2 py-1.5 text-sm text-white/90">Noch kein Planungsgebiet angelegt.</p>
  }

  return (
    <ModeCollectionSelect
      aria-label="Planungsgebiet und Variante"
      value={String(selectedVariantId ?? options[0]?.value ?? '')}
      options={options.map((option) => ({
        value: option.value,
        label: option.label,
        private: true,
      }))}
      onChange={(next) => onSelect(Number(next))}
    />
  )
}
