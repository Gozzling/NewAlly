
import UnitTierList, { TFTUnit } from '@/components/UnitTierList'

/** Simple wrapper page for the Unit Tier List – always shows skeleton */
export function Units() {
  // No real data – always loading skeleton
  const loading = true
  const emptyUnits: TFTUnit[] = []
  return <UnitTierList units={emptyUnits} isLoading={loading} />
}
