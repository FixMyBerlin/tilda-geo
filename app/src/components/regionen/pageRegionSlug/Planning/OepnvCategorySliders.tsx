import { CategorySliders } from './CategorySliders'
import { DEFAULT_OEPNV_SHARES, OEPNV_CATEGORIES } from './oepnvCategories'
import type { OepnvShares } from './oepnvShares'

/**
 * Bindet die generische `CategorySliders` (siehe dort für Verhalten/Begründung) an die beiden
 * ÖPNV/Bikesharing-Gruppen. Reiner Wiring-Wrapper, keine eigene Logik.
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
