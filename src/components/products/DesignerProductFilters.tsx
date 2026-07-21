import { ProductFacets } from '../../types/product';
import { labelForCategory } from '../../utils/taxonomy';

export interface DesignerFilterState {
  category?: string;
  occasion?: string;
  gender?: string;
  color?: string;
  availability?: 'in_stock';
  sort?: string;
}

interface DesignerProductFiltersProps {
  filters: DesignerFilterState;
  facets?: ProductFacets;
  onChange: (next: Partial<DesignerFilterState>) => void;
}

const GENDERS = [
  { value: undefined, label: 'All' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
];

/**
 * Filter rail for a single designer's collection — category / occasion /
 * gender / color come from live facets on the products response, so the
 * available options always match what that designer actually stocks.
 */
export function DesignerProductFilters({ filters, facets, onChange }: DesignerProductFiltersProps) {
  return (
    <aside className="space-y-8">
      <div>
        <h3 className="text-xs tracking-[0.2em] uppercase mb-3">Sort</h3>
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="w-full border border-black/15 px-3 py-2 text-sm bg-white"
        >
          <option value="newest">Newest</option>
          <option value="trending">Trending</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div>
        <h3 className="text-xs tracking-[0.2em] uppercase mb-3">Gender</h3>
        <div className="flex gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.label}
              type="button"
              onClick={() => onChange({ gender: g.value })}
              className={`px-3 py-1.5 text-xs border transition-colors ${
                filters.gender === g.value
                  ? 'bg-black text-white border-black'
                  : 'border-black/15 text-black/70 hover:border-black/40'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {facets?.categories?.length ? (
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase mb-3">Category</h3>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onChange({ category: undefined })}
              className={`block w-full text-left text-sm py-1 ${!filters.category ? 'font-medium' : 'text-black/60'}`}
            >
              All categories
            </button>
            {facets.categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onChange({ category: c.value })}
                className={`flex w-full items-center justify-between text-left text-sm py-1 ${
                  filters.category === c.value ? 'font-medium' : 'text-black/60'
                }`}
              >
                <span>{labelForCategory(c.value)}</span>
                <span className="text-black/30">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {facets?.occasions?.length ? (
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase mb-3">Occasion</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ occasion: undefined })}
              className={`px-3 py-1.5 text-xs border transition-colors ${
                !filters.occasion ? 'bg-black text-white border-black' : 'border-black/15 text-black/70 hover:border-black/40'
              }`}
            >
              All
            </button>
            {facets.occasions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange({ occasion: o.value })}
                className={`px-3 py-1.5 text-xs border transition-colors ${
                  filters.occasion === o.value
                    ? 'bg-black text-white border-black'
                    : 'border-black/15 text-black/70 hover:border-black/40'
                }`}
              >
                {o.value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {facets?.colors?.length ? (
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase mb-3">Color</h3>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const selected = filters.color === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onChange({ color: selected ? undefined : c.value })}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    selected ? 'bg-black text-white border-black' : 'border-black/15 text-black/70 hover:border-black/40'
                  }`}
                >
                  {c.value}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.availability === 'in_stock'}
          onChange={(e) => onChange({ availability: e.target.checked ? 'in_stock' : undefined })}
        />
        In stock only
      </label>
    </aside>
  );
}
