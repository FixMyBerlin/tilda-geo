import type { ReactNode } from 'react'
import { weightToPoints } from './weightScale'

/**
 * Factors that only admins can switch on (weight keys). Their default weight is 0, so for everyone
 * else they do not count. If an admin switches one on, the score changes for all users of the
 * Planungsgebiet — so the factor is then shown to everyone (without the admin box), so nobody gets
 * a score they cannot explain or reset.
 */
const ADMIN_ONLY_WEIGHT_KEYS = ['w_tempo30']

export const isAdminOnlyFactor = (weightKey: string) => ADMIN_ONLY_WEIGHT_KEYS.includes(weightKey)

/** Hidden for non-admins as long as the factor is off. */
export const adminOnlyFactorHidden = (
  weightKey: string,
  weight: number | undefined,
  isAdmin: boolean,
) => !isAdmin && isAdminOnlyFactor(weightKey) && weightToPoints(weight) === 0

/** Pink admin box, same colors as `AdminLogDataButton`. */
export const AdminFactorBox = ({ children }: { children: ReactNode }) => (
  <div className="-mx-1 my-1 rounded-md border border-pink-400 bg-pink-300 px-2 py-1">
    <div className="text-[10px] font-semibold text-pink-900 uppercase">
      Nur für Admins — wirkt eingeschaltet für alle
    </div>
    {children}
  </div>
)
