import { CategorySliders } from './CategorySliders'
import { DEFAULT_OEPNV_SHARES, OEPNV_CATEGORIES } from './oepnvCategories'
import type { OepnvShares } from './oepnvShares'

/**
 * Binds the generic `CategorySliders` (see there for behavior/rationale) to the two
 * ÖPNV/bikesharing groups. Pure wiring wrapper, no logic of its own.
 */
export const OepnvCategorySliders = ({
  shares,
  onChange,
  open,
  onOpenChange,
  disabled = false,
}: {
  shares: OepnvShares
  onChange: (shares: OepnvShares) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
}) => (
  <CategorySliders
    categories={OEPNV_CATEGORIES}
    defaultShares={DEFAULT_OEPNV_SHARES}
    shares={shares}
    onChange={onChange}
    open={open}
    onOpenChange={onOpenChange}
    disabled={disabled}
    groupLabel="ÖPNV-Arten"
    factorLabel="ÖPNV + Bikesharing"
  />
)
