import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductFilters } from '../components/products/ProductFilters';
import { ProductGrid } from '../components/products/ProductGrid';
import { getProducts } from '../utils/api';
import { ProductFacets, ProductQuery, ProductSummary } from '../types/product';
import { trackEvent } from '../utils/analytics';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [facets, setFacets] = useState<ProductFacets>();
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const query: ProductQuery = useMemo(
    () => ({
      q: searchParams.get('q') || undefined,
      audience: 'women',
      sort: (searchParams.get('sort') as ProductQuery['sort']) || 'relevance',
      page: Number(searchParams.get('page') || 1),
      limit: 24,
      brand: searchParams.get('brand')?.split(',').filter(Boolean),
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    }),
    [searchParams]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (query.q) trackEvent('search_submitted', { q: query.q });
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
  }, [query]);

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
      <form
        className="mb-8"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          updateQuery({ q: String(form.get('q') || ''), page: 1 });
        }}
      >
        <input
          name="q"
          defaultValue={query.q || ''}
          placeholder="Search dresses, ethnic wear, brands…"
          className="w-full border-b border-black/20 bg-transparent py-3 text-lg outline-none"
        />
      </form>

      <p className="text-sm text-black/50 mb-6">
        {query.q ? `${total} results for “${query.q}”` : 'Browse women’s styles'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <ProductFilters query={query} facets={facets} onChange={updateQuery} />
        <ProductGrid products={products} loading={loading} />
      </div>
    </div>
  );
}
