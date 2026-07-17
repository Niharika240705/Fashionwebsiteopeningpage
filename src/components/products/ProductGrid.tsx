import { ProductSummary } from '../../types/product';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductSummary[];
  loading?: boolean;
  emptyMessage?: string;
  onTryOn?: (product: ProductSummary) => void;
  onRequireAuth?: () => void;
}

export function ProductGrid({
  products,
  loading,
  emptyMessage = 'No products found.',
  onTryOn,
  onRequireAuth,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-neutral-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <p className="py-16 text-center text-black/50">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onTryOn={onTryOn}
          onRequireAuth={onRequireAuth}
        />
      ))}
    </div>
  );
}
