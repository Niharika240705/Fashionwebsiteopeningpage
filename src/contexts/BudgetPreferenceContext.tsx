import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { BudgetSelection, budgetLevelToRange } from '../utils/budget';

export type BudgetMode = 'tier' | 'custom';

export interface BudgetPreference {
  mode: BudgetMode;
  tier: BudgetSelection;
  minPrice?: number;
  maxPrice?: number;
}

const STORAGE_KEY = 'persona.budget';

const DEFAULT_PREFERENCE: BudgetPreference = { mode: 'tier', tier: 'all' };

function readStoredPreference(): BudgetPreference {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCE;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.mode === 'tier' || parsed.mode === 'custom')) {
      return {
        mode: parsed.mode,
        tier: parsed.tier ?? 'all',
        minPrice: typeof parsed.minPrice === 'number' ? parsed.minPrice : undefined,
        maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : undefined,
      };
    }
  } catch {
    // Corrupt or inaccessible sessionStorage — fall back to defaults.
  }
  return DEFAULT_PREFERENCE;
}

interface BudgetPreferenceContextType {
  preference: BudgetPreference;
  /** Convenience: just the min/max price for wiring into ProductQuery. */
  priceRange: { minPrice?: number; maxPrice?: number };
  /** Select a tier ("all" clears the filter). Overrides any custom range. */
  setTier: (tier: BudgetSelection) => BudgetPreference;
  /** Set a custom min/max range, overriding any selected tier. */
  setCustomRange: (minPrice?: number, maxPrice?: number) => BudgetPreference;
  /** Reset to the default (no preference) state. */
  reset: () => void;
}

const BudgetPreferenceContext = createContext<BudgetPreferenceContextType | undefined>(undefined);

export function BudgetPreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<BudgetPreference>(() => readStoredPreference());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch {
      // sessionStorage may be unavailable (private mode / quota) — safe to skip.
    }
  }, [preference]);

  const setTier = (tier: BudgetSelection): BudgetPreference => {
    const next: BudgetPreference =
      tier === 'all'
        ? { mode: 'tier', tier: 'all' }
        : { mode: 'tier', tier, ...budgetLevelToRange(tier) };
    setPreference(next);
    return next;
  };

  const setCustomRange = (minPrice?: number, maxPrice?: number): BudgetPreference => {
    const next: BudgetPreference = { mode: 'custom', tier: 'all', minPrice, maxPrice };
    setPreference(next);
    return next;
  };

  const reset = () => setPreference(DEFAULT_PREFERENCE);

  const priceRange = useMemo(
    () => ({ minPrice: preference.minPrice, maxPrice: preference.maxPrice }),
    [preference.minPrice, preference.maxPrice]
  );

  return (
    <BudgetPreferenceContext.Provider
      value={{ preference, priceRange, setTier, setCustomRange, reset }}
    >
      {children}
    </BudgetPreferenceContext.Provider>
  );
}

export function useBudgetPreference() {
  const context = useContext(BudgetPreferenceContext);
  if (!context) {
    throw new Error('useBudgetPreference must be used within BudgetPreferenceProvider');
  }
  return context;
}
