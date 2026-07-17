import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ProductFilters } from '../components/products/ProductFilters';
import { ProductGrid } from '../components/products/ProductGrid';
import { getProducts } from '../utils/api';
import { ProductFacets, ProductQuery, ProductSummary } from '../types/product';
import { trackEvent } from '../utils/analytics';

export function CategoryPage() {
  const { category = 'dresses' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [facets, setFacets] = useState<ProductFacets>();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query: ProductQuery = useMemo(
    () => ({
      audience: 'women',
      category,
      sort: (searchParams.get('sort') as ProductQuery['sort']) || 'trending',
      page: Number(searchParams.get('page') || 1),
      limit: 24,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true' || undefined,
      brand: searchParams.get('brand')?.split(',').filter(Boolean),
    }),
    [category, searchParams]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    trackEvent('category_viewed', { category });
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
  }, [query, category]);

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

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-black/50 mb-2">Women</p>
          <h1 className="text-3xl md:text-4xl capitalize">{category.replace('-', ' ')}</h1>
          <p className="text-sm text-black/50 mt-2">{total} styles from partner retailers</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="text-xs tracking-widest uppercase border border-black px-4 py-2"
        >
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <ProductFilters query={query} facets={facets} onChange={updateQuery} />
        <div>
          {error ? (
            <p className="text-red-600 py-10">{error}</p>
          ) : (
            <ProductGrid products={products} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}
