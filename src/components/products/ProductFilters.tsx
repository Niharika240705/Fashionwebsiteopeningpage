import { ProductFacets, ProductQuery } from '../../types/product';

interface ProductFiltersProps {
  query: ProductQuery;
  facets?: ProductFacets;
  onChange: (next: Partial<ProductQuery>) => void;
}

export function ProductFilters({ query, facets, onChange }: ProductFiltersProps) {
  return (
    <aside className="space-y-8">
      <div>
        <h3 className="text-xs tracking-[0.2em] uppercase mb-3">Sort</h3>
        <select
          value={query.sort || 'trending'}
          onChange={(e) => onChange({ sort: e.target.value as ProductQuery['sort'], page: 1 })}
          className="w-full border border-black/15 px-3 py-2 text-sm bg-white"
        >
          <option value="trending">Trending</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="discount">Best Discount</option>
        </select>
      </div>

      <div>
        <h3 className="text-xs tracking-[0.2em] uppercase mb-3">Price</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={query.minPrice ?? ''}
            onChange={(e) =>
              onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
            className="w-full border border-black/15 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={query.maxPrice ?? ''}
            onChange={(e) =>
              onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
            className="w-full border border-black/15 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(query.inStock)}
          onChange={(e) => onChange({ inStock: e.target.checked || undefined, page: 1 })}
        />
        In stock only
      </label>

      {facets?.brands?.length ? (
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase mb-3">Brands</h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {facets.brands.slice(0, 12).map((brand) => {
              const selected = Array.isArray(query.brand)
                ? query.brand.includes(brand.value)
                : query.brand === brand.value;
              return (
                <label key={brand.value} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const current = Array.isArray(query.brand)
                          ? query.brand
                          : query.brand
                            ? [query.brand]
                            : [];
                        const next = selected
                          ? current.filter((b) => b !== brand.value)
                          : [...current, brand.value];
                        onChange({ brand: next.length ? next : undefined, page: 1 });
                      }}
                    />
                    {brand.value}
                  </span>
                  <span className="text-black/40">{brand.count}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
