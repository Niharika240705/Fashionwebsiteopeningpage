import { describe, expect, it } from 'vitest';
import {
  BUDGET_TIERS,
  budgetLevelToRange,
  getBudgetTier,
  priceToBudgetLevel,
  priceToBudgetTier,
  rangeToBudgetLevel,
} from './budget';

describe('priceToBudgetLevel', () => {
  it('classifies budget tier prices (<= 1500)', () => {
    expect(priceToBudgetLevel(0)).toBe('budget');
    expect(priceToBudgetLevel(999)).toBe('budget');
    expect(priceToBudgetLevel(1500)).toBe('budget');
  });

  it('classifies mid-range tier prices (1501 - 4000)', () => {
    expect(priceToBudgetLevel(1501)).toBe('midRange');
    expect(priceToBudgetLevel(2500)).toBe('midRange');
    expect(priceToBudgetLevel(4000)).toBe('midRange');
  });

  it('classifies premium tier prices (4001 - 10000)', () => {
    expect(priceToBudgetLevel(4001)).toBe('premium');
    expect(priceToBudgetLevel(7000)).toBe('premium');
    expect(priceToBudgetLevel(10000)).toBe('premium');
  });

  it('classifies luxury tier prices (10001+)', () => {
    expect(priceToBudgetLevel(10001)).toBe('luxury');
    expect(priceToBudgetLevel(999999)).toBe('luxury');
  });

  it('returns null for invalid prices', () => {
    expect(priceToBudgetLevel(undefined)).toBeNull();
    expect(priceToBudgetLevel(null)).toBeNull();
    expect(priceToBudgetLevel(-1)).toBeNull();
    expect(priceToBudgetLevel(NaN)).toBeNull();
  });
});

describe('priceToBudgetTier', () => {
  it('returns the full tier definition for a valid price', () => {
    const tier = priceToBudgetTier(2000);
    expect(tier?.level).toBe('midRange');
    expect(tier?.label).toBe('Mid-Range');
  });

  it('returns null for invalid prices', () => {
    expect(priceToBudgetTier(-5)).toBeNull();
  });
});

describe('getBudgetTier', () => {
  it('returns the correct bounds for each tier', () => {
    expect(getBudgetTier('budget')).toMatchObject({ min: 0, max: 1500 });
    expect(getBudgetTier('midRange')).toMatchObject({ min: 1501, max: 4000 });
    expect(getBudgetTier('premium')).toMatchObject({ min: 4001, max: 10000 });
    expect(getBudgetTier('luxury')).toMatchObject({ min: 10001, max: null });
  });

  it('exposes exactly four tiers in ascending order', () => {
    expect(BUDGET_TIERS.map((t) => t.level)).toEqual(['budget', 'midRange', 'premium', 'luxury']);
  });
});

describe('budgetLevelToRange', () => {
  it('returns an empty range for "all"', () => {
    expect(budgetLevelToRange('all')).toEqual({});
    expect(budgetLevelToRange(undefined)).toEqual({});
    expect(budgetLevelToRange(null)).toEqual({});
  });

  it('maps a tier to its min/max price range', () => {
    expect(budgetLevelToRange('budget')).toEqual({ minPrice: undefined, maxPrice: 1500 });
    expect(budgetLevelToRange('midRange')).toEqual({ minPrice: 1501, maxPrice: 4000 });
    expect(budgetLevelToRange('premium')).toEqual({ minPrice: 4001, maxPrice: 10000 });
    expect(budgetLevelToRange('luxury')).toEqual({ minPrice: 10001, maxPrice: undefined });
  });
});

describe('rangeToBudgetLevel', () => {
  it('detects a tier from an exact matching range', () => {
    expect(rangeToBudgetLevel(1501, 4000)).toBe('midRange');
    expect(rangeToBudgetLevel(10001, undefined)).toBe('luxury');
    expect(rangeToBudgetLevel(undefined, 1500)).toBe('budget');
  });

  it('returns "all" when no bounds are set', () => {
    expect(rangeToBudgetLevel(undefined, undefined)).toBe('all');
  });

  it('returns "all" for a custom (non-tier) range', () => {
    expect(rangeToBudgetLevel(500, 5000)).toBe('all');
  });

  it('round-trips with budgetLevelToRange for every tier', () => {
    for (const tier of BUDGET_TIERS) {
      const range = budgetLevelToRange(tier.level);
      expect(rangeToBudgetLevel(range.minPrice, range.maxPrice)).toBe(tier.level);
    }
  });
});
