import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Slider } from '../ui/slider';
import { cn } from '../ui/utils';
import { useBudgetPreference } from '../../contexts/BudgetPreferenceContext';
import {
  BUDGET_CUSTOM_RANGE_DEFAULT,
  BUDGET_CUSTOM_RANGE_MAX,
  BUDGET_CUSTOM_RANGE_MIN,
  BUDGET_CUSTOM_RANGE_STEP,
  BUDGET_TIERS,
  BudgetSelection,
  formatINR,
} from '../../utils/budget';

interface BudgetFilterProps {
  /** Called whenever the resolved min/max price range changes. */
  onChange?: (range: { minPrice?: number; maxPrice?: number }) => void;
  className?: string;
  /** Renders a denser single-row layout (used for the homepage sticky bar). */
  compact?: boolean;
}

/**
 * Reusable budget preference control: pick a tier ("All", Budget, Mid-Range,
 * Premium, Luxury) or switch to a custom min/max range via a dual slider.
 * Reads/writes `BudgetPreferenceContext`, which persists to `sessionStorage`
 * so the preference survives navigation between Home, Category, and Search.
 */
export function BudgetFilter({ onChange, className, compact }: BudgetFilterProps) {
  const { preference, setTier, setCustomRange } = useBudgetPreference();
  const [customOpen, setCustomOpen] = useState(preference.mode === 'custom');
  const [range, setRange] = useState<[number, number]>([
    preference.minPrice ?? BUDGET_CUSTOM_RANGE_DEFAULT[0],
    preference.maxPrice ?? BUDGET_CUSTOM_RANGE_DEFAULT[1],
  ]);

  // Keep the slider's visual position in sync if the preference changes
  // from elsewhere (e.g. cleared via "All", or restored from sessionStorage).
  useEffect(() => {
    if (preference.mode === 'custom') {
      setRange([
        preference.minPrice ?? BUDGET_CUSTOM_RANGE_MIN,
        preference.maxPrice ?? BUDGET_CUSTOM_RANGE_MAX,
      ]);
      setCustomOpen(true);
    }
  }, [preference.mode, preference.minPrice, preference.maxPrice]);

  const activeTier: BudgetSelection = preference.mode === 'tier' ? preference.tier : 'all';
  const isCustomActive = preference.mode === 'custom';

  const handleTierClick = (tier: BudgetSelection) => {
    setCustomOpen(false);
    const next = setTier(tier);
    onChange?.({ minPrice: next.minPrice, maxPrice: next.maxPrice });
  };

  const handleCustomToggle = () => {
    setCustomOpen((open) => !open);
  };

  const handleSliderCommit = (next: number[]) => {
    const [minPrice, maxPrice] = next as [number, number];
    setRange([minPrice, maxPrice]);
    const applied = setCustomRange(minPrice, maxPrice);
    onChange?.({ minPrice: applied.minPrice, maxPrice: applied.maxPrice });
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex flex-wrap items-center gap-2', compact ? 'gap-1.5' : 'gap-2')}>
        {!compact && (
          <span className="text-[11px] tracking-[0.2em] uppercase text-black/50 mr-1 shrink-0">
            Budget
          </span>
        )}

        <button
          type="button"
          onClick={() => handleTierClick('all')}
          className={cn(
            'px-3 py-1.5 text-xs tracking-wide border transition-colors',
            activeTier === 'all' && !isCustomActive
              ? 'bg-black text-white border-black'
              : 'border-black/15 text-black/70 hover:border-black/40'
          )}
        >
          All
        </button>

        {BUDGET_TIERS.map((tier) => {
          const selected = !isCustomActive && activeTier === tier.level;
          return (
            <button
              key={tier.level}
              type="button"
              onClick={() => handleTierClick(tier.level)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide border transition-colors',
                selected
                  ? 'bg-black text-white border-black'
                  : 'border-black/15 text-black/70 hover:border-black/40'
              )}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  selected ? 'bg-white' : tier.dotClassName
                )}
              />
              {tier.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleCustomToggle}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide border transition-colors',
            isCustomActive || customOpen
              ? 'bg-black text-white border-black'
              : 'border-black/15 text-black/70 hover:border-black/40'
          )}
          aria-pressed={isCustomActive}
          aria-expanded={customOpen}
        >
          <SlidersHorizontal size={12} />
          Custom
        </button>
      </div>

      {customOpen && (
        <div className="mt-3 max-w-md">
          <Slider
            value={range}
            min={BUDGET_CUSTOM_RANGE_MIN}
            max={BUDGET_CUSTOM_RANGE_MAX}
            step={BUDGET_CUSTOM_RANGE_STEP}
            onValueChange={(value) => setRange(value as [number, number])}
            onValueCommit={handleSliderCommit}
            className="[&_[data-slot=slider-range]]:bg-black [&_[data-slot=slider-thumb]]:border-black"
          />
          <div className="flex justify-between text-xs text-black/60 mt-2">
            <span>{formatINR(range[0])}</span>
            <span>{formatINR(range[1])}</span>
          </div>
        </div>
      )}
    </div>
  );
}
