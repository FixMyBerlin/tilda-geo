import { CategorySliders } from './CategorySliders'
import { DEFAULT_ZIELORT_SHARES, ZIELORT_CATEGORIES } from './zielortCategories'
import type { ZielortShares } from './zielortShares'

/**
 * Binds the generic `CategorySliders` (see there for behavior and rationale) to the four
 * target location categories. Pure wiring wrapper, no logic of its own.
 */
export const ZielortCategorySliders = ({
  shares,
  onChange,
  open,
  onOpenChange,
  disabled = false,
}: {
  shares: ZielortShares
  onChange: (shares: ZielortShares) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
}) => (
  <CategorySliders
    categories={ZIELORT_CATEGORIES}
    defaultShares={DEFAULT_ZIELORT_SHARES}
    shares={shares}
    onChange={onChange}
    open={open}
    onOpenChange={onOpenChange}
    disabled={disabled}
    groupLabel="Zielort-Arten"
    factorLabel="Zielorte"
  />
)
