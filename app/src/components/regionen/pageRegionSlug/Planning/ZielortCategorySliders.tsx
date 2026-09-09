import { CategorySliders } from './CategorySliders'
import { DEFAULT_ZIELORT_SHARES, ZIELORT_CATEGORIES } from './zielortCategories'
import type { ZielortShares } from './zielortShares'

/**
 * Bindet die generische `CategorySliders` (siehe dort für Verhalten/Begründung) an die vier
 * Zielort-Kategorien. Reiner Wiring-Wrapper, keine eigene Logik.
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
