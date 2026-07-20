import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BudgetFilter } from '../components/products/BudgetFilter';
import { ProductFilters } from '../components/products/ProductFilters';
import { ProductGrid } from '../components/products/ProductGrid';
import { VirtualTryOnModal } from '../components/VirtualTryOnModal';
import { getProducts } from '../utils/api';
import { ProductFacets, ProductQuery, ProductSummary } from '../types/product';
import { trackEvent } from '../utils/analytics';
import {
  defaultCategoryForAudience,
  isAudience,
  labelForAudience,
  labelForCategory,
} from '../utils/taxonomy';
import { useBudgetPreference } from '../contexts/BudgetPreferenceContext';

interface CategoryPageProps {
  onRequireAuth?: () => void;
}

export function CategoryPage({ onRequireAuth }: CategoryPageProps) {
  const { audience: audienceParam, category: categoryParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [facets, setFacets] = useState<ProductFacets>();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tryOnProduct, setTryOnProduct] = useState<ProductSummary | null>(null);
  const { priceRange } = useBudgetPreference();
  const didSyncBudget = useRef(false);

  const audienceValid = isAudience(audienceParam);
  const audience = audienceValid ? audienceParam : 'women';
  const category = categoryParam || defaultCategoryForAudience(audience);

  const query: ProductQuery = useMemo(
    () => ({
      audience,
      category,
      sort: (searchParams.get('sort') as ProductQuery['sort']) || 'trending',
      page: Number(searchParams.get('page') || 1),
      limit: 24,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true' || undefined,
      brand: searchParams.get('brand')?.split(',').filter(Boolean),
    }),
    [audience, category, searchParams]
  );

  useEffect(() => {
    if (!audienceValid) return;
    let cancelled = false;
    setLoading(true);
    trackEvent('category_viewed', { audience, category });
    getProducts(query)
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products || []);
        setFacets(data.facets);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, audience, category, audienceValid]);

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

  // On first load, if the URL already carries a shareable minPrice/maxPrice
  // (e.g. a shared link), leave it as-is. Otherwise, apply the persisted
  // budget preference from context so it's honored even when arriving here
  // without ever touching the filter on this page (e.g. via a Monthly
  // Trends "shop" link on the homepage).
  useEffect(() => {
    if (didSyncBudget.current) return;
    didSyncBudget.current = true;
    const hasUrlPrice = searchParams.has('minPrice') || searchParams.has('maxPrice');
    if (!hasUrlPrice && (priceRange.minPrice !== undefined || priceRange.maxPrice !== undefined)) {
      updateQuery({ minPrice: priceRange.minPrice, maxPrice: priceRange.maxPrice });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!audienceValid) {
    return <Navigate to="/women/dresses" replace />;
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-black/50 mb-2">
            {labelForAudience(audience)}
          </p>
          <h1 className="text-3xl md:text-4xl">{labelForCategory(category)}</h1>
          <p className="text-sm text-black/50 mt-2">{total} styles from partner retailers</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/search?audience=${audience}`)}
          className="text-xs tracking-widest uppercase border border-black px-4 py-2"
        >
          Search
        </button>
      </div>

      <div className="mb-8 pb-6 border-b border-black/10">
        <BudgetFilter
          onChange={({ minPrice, maxPrice }) => updateQuery({ minPrice, maxPrice, page: 1 })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <ProductFilters query={query} facets={facets} onChange={updateQuery} />
        <div>
          {error ? (
            <p className="text-red-600 py-10">{error}</p>
          ) : (
            <ProductGrid
              products={products}
              loading={loading}
              onTryOn={setTryOnProduct}
              onRequireAuth={onRequireAuth}
            />
          )}
        </div>
      </div>

      <VirtualTryOnModal
        isOpen={!!tryOnProduct}
        product={tryOnProduct}
        onClose={() => setTryOnProduct(null)}
      />
    </div>
  );
}
