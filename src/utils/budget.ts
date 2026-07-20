/**
 * Budget Preference & Price Filtering — shared tier definitions.
 *
 * Prices are assumed to be in INR (the catalog's primary currency). If a
 * product's `currency` is not INR, treat these bands as approximate; tune
 * the thresholds below if the catalog currency changes.
 */

export type BudgetLevel = 'budget' | 'midRange' | 'premium' | 'luxury';
export type BudgetSelection = BudgetLevel | 'all';

export interface BudgetTierDefinition {
  level: BudgetLevel;
  /** Full UI label, e.g. "Mid-Range". */
  label: string;
  /** Lower bound (inclusive), in INR. */
  min: number;
  /** Upper bound (inclusive), in INR. `null` means no upper bound. */
  max: number | null;
  /** Tailwind text color class for badges/labels. */
  colorClassName: string;
  /** Tailwind background color class for the small dot badge. */
  dotClassName: string;
}

/**
 * Budget tiers (INR), tuned for the Indian fashion catalog:
 * - Budget: price <= 1500
 * - Mid-Range: 1501 - 4000
 * - Premium: 4001 - 10000
 * - Luxury: 10001+
 */
export const BUDGET_TIERS: BudgetTierDefinition[] = [
  {
    level: 'budget',
    label: 'Budget',
    min: 0,
    max: 1500,
    colorClassName: 'text-emerald-600',
    dotClassName: 'bg-emerald-500',
  },
  {
    level: 'midRange',
    label: 'Mid-Range',
    min: 1501,
    max: 4000,
    colorClassName: 'text-blue-600',
    dotClassName: 'bg-blue-500',
  },
  {
    level: 'premium',
    label: 'Premium',
    min: 4001,
    max: 10000,
    colorClassName: 'text-purple-600',
    dotClassName: 'bg-purple-500',
  },
  {
    level: 'luxury',
    label: 'Luxury',
    min: 10001,
    max: null,
    colorClassName: 'text-neutral-900',
    dotClassName: 'bg-neutral-900',
  },
];

const TIER_BY_LEVEL: Record<BudgetLevel, BudgetTierDefinition> = BUDGET_TIERS.reduce(
  (acc, tier) => {
    acc[tier.level] = tier;
    return acc;
  },
  {} as Record<BudgetLevel, BudgetTierDefinition>
);

/** Custom range slider bounds (wider than any single tier). */
export const BUDGET_CUSTOM_RANGE_MIN = 0;
export const BUDGET_CUSTOM_RANGE_MAX = 50000;
export const BUDGET_CUSTOM_RANGE_STEP = 100;
/** Suggested default handles for the custom dual slider UX. */
export const BUDGET_CUSTOM_RANGE_DEFAULT: [number, number] = [500, 5000];

/** Look up a tier's definition by level. */
export function getBudgetTier(level: BudgetLevel): BudgetTierDefinition {
  return TIER_BY_LEVEL[level];
}

/** All tier definitions, in display order (Budget → Luxury). */
export function getBudgetTiers(): BudgetTierDefinition[] {
  return BUDGET_TIERS;
}

/**
 * Classify a price into a budget tier. Returns `null` for invalid
 * (negative, NaN, or missing) prices.
 */
export function priceToBudgetLevel(price: number | null | undefined): BudgetLevel | null {
  if (price === null || price === undefined) return null;
  if (!Number.isFinite(price) || price < 0) return null;

  for (const tier of BUDGET_TIERS) {
    if (price >= tier.min && (tier.max === null || price <= tier.max)) {
      return tier.level;
    }
  }
  return null;
}

/** Convenience wrapper returning the full tier definition for a price. */
export function priceToBudgetTier(price: number | null | undefined): BudgetTierDefinition | null {
  const level = priceToBudgetLevel(price);
  return level ? getBudgetTier(level) : null;
}

/**
 * Convert a tier selection ("all" or a specific level) into a min/max price
 * range suitable for `ProductQuery`. "all" clears both bounds.
 */
export function budgetLevelToRange(
  selection: BudgetSelection | null | undefined
): { minPrice?: number; maxPrice?: number } {
  if (!selection || selection === 'all') return {};
  const tier = getBudgetTier(selection);
  if (!tier) return {};
  return {
    minPrice: tier.min > 0 ? tier.min : undefined,
    maxPrice: tier.max ?? undefined,
  };
}

/**
 * Given a min/max price range, find the tier whose bounds match exactly
 * (used to keep the UI's tier pills in sync when a range was set via a
 * shared URL rather than by clicking a tier).
 */
export function rangeToBudgetLevel(
  minPrice?: number,
  maxPrice?: number
): BudgetSelection {
  if (minPrice === undefined && maxPrice === undefined) return 'all';
  const match = BUDGET_TIERS.find((tier) => {
    const tierMin = tier.min > 0 ? tier.min : undefined;
    const tierMax = tier.max ?? undefined;
    return tierMin === minPrice && tierMax === maxPrice;
  });
  return match ? match.level : 'all';
}

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}
