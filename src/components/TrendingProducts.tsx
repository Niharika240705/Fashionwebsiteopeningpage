import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { ProductGrid } from './products/ProductGrid';
import { getTrendingProducts } from '../utils/api';
import { ProductSummary } from '../types/product';

interface TrendingProductsProps {
  category?: string;
  limit?: number;
}

export function TrendingProducts({ category, limit = 20 }: TrendingProductsProps) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getTrendingProducts({ category, audience: 'women', limit })
      .then((data) => {
        setProducts(data.products || []);
        setError(null);
      })
      .catch((err) => setError(err.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [category, limit]);

  return (
    <div className="py-12 relative z-0">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-black" />
            <h2 className="text-3xl font-bold text-black">
              {category
                ? `${category.charAt(0).toUpperCase() + category.slice(1)} Trends`
                : 'Trending Now'}
            </h2>
          </div>
          <p className="text-gray-600 text-sm">
            Partner styles for women. Click through to buy on the retailer site.
          </p>
        </div>
        <Link
          to={category ? `/women/${category}` : '/women/dresses'}
          className="text-xs tracking-widest uppercase border border-black px-4 py-2"
        >
          Shop women
        </Link>
      </div>

      {error ? (
        <div className="py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      ) : (
        <ProductGrid products={products} loading={loading} emptyMessage="No trending products yet. Seed the demo affiliate feed to preview." />
      )}
    </div>
  );
}
