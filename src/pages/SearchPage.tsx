import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BudgetFilter } from '../components/products/BudgetFilter';
import { ProductFilters } from '../components/products/ProductFilters';
import { ProductGrid } from '../components/products/ProductGrid';
import { VirtualTryOnModal } from '../components/VirtualTryOnModal';
import { getProducts } from '../utils/api';
import { ProductFacets, ProductQuery, ProductSummary } from '../types/product';
import { trackEvent } from '../utils/analytics';
import { Audience, isAudience, labelForAudience } from '../utils/taxonomy';
import { useBudgetPreference } from '../contexts/BudgetPreferenceContext';

interface SearchPageProps {
  onRequireAuth?: () => void;
}

const AUDIENCES: Audience[] = ['women', 'men', 'kids'];

export function SearchPage({ onRequireAuth }: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [facets, setFacets] = useState<ProductFacets>();
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [tryOnProduct, setTryOnProduct] = useState<ProductSummary | null>(null);
  const { priceRange } = useBudgetPreference();
  const didSyncBudget = useRef(false);

  const audienceParam = searchParams.get('audience') || 'women';
  const audience: Audience = isAudience(audienceParam) ? audienceParam : 'women';

  const query: ProductQuery = useMemo(
    () => ({
      q: searchParams.get('q') || undefined,
      audience,
      sort: (searchParams.get('sort') as ProductQuery['sort']) || 'relevance',
      page: Number(searchParams.get('page') || 1),
      limit: 24,
      brand: searchParams.get('brand')?.split(',').filter(Boolean),
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    }),
    [searchParams, audience]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (query.q) trackEvent('search_submitted', { q: query.q, audience });
    getProducts(query)
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products || []);
        setFacets(data.facets);
        setTotal(data.total || 0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, audience]);

  const updateQuery = (next: Partial<ProductQuery>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  // Apply the persisted budget preference on first load if the URL doesn't
  // already carry an explicit (shareable) minPrice/maxPrice.
  useEffect(() => {
    if (didSyncBudget.current) return;
    didSyncBudget.current = true;
    const hasUrlPrice = searchParams.has('minPrice') || searchParams.has('maxPrice');
    if (!hasUrlPrice && (priceRange.minPrice !== undefined || priceRange.maxPrice !== undefined)) {
      updateQuery({ minPrice: priceRange.minPrice, maxPrice: priceRange.maxPrice });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14">
      <form
        className="mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          updateQuery({ q: String(form.get('q') || ''), page: 1 });
        }}
      >
        <input
          name="q"
          defaultValue={query.q || ''}
          placeholder="Search clothes, jewellery, shoes, brands…"
          className="w-full border-b border-black/20 bg-transparent py-3 text-lg outline-none"
        />
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {AUDIENCES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => updateQuery({ audience: option, page: 1 })}
            className={`px-4 py-2 text-xs tracking-widest uppercase border ${
              audience === option ? 'bg-black text-white border-black' : 'border-black/20'
            }`}
          >
            {labelForAudience(option)}
          </button>
        ))}
      </div>

      <p className="text-sm text-black/50 mb-6">
        {query.q
          ? `${total} results for “${query.q}” in ${labelForAudience(audience)}`
          : `Browse ${labelForAudience(audience).toLowerCase()} styles`}
      </p>

      <div className="mb-8 pb-6 border-b border-black/10">
        <BudgetFilter
          onChange={({ minPrice, maxPrice }) => updateQuery({ minPrice, maxPrice, page: 1 })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <ProductFilters query={query} facets={facets} onChange={updateQuery} />
        <ProductGrid
          products={products}
          loading={loading}
          onTryOn={setTryOnProduct}
          onRequireAuth={onRequireAuth}
        />
      </div>

      <VirtualTryOnModal
        isOpen={!!tryOnProduct}
        product={tryOnProduct}
        onClose={() => setTryOnProduct(null)}
      />
    </div>
  );
}
