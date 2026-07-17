import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductGrid } from '../products/ProductGrid';
import { getProducts } from '../../utils/api';
import { ProductSummary } from '../../types/product';
import { trackEvent } from '../../utils/analytics';

interface UfindFeedProps {
  isOpen: boolean;
  bodyShape: string;
  onClose: () => void;
}

function categoryForBodyShape(bodyShape: string): string | undefined {
  const key = bodyShape.toLowerCase();
  if (key.includes('hourglass')) return 'dresses';
  if (key.includes('pear')) return 'tops';
  if (key.includes('apple')) return 'ethnic-wear';
  if (key.includes('rectangle')) return 'bottoms';
  return 'dresses';
}

export function UfindFeed({ isOpen, bodyShape, onClose }: UfindFeedProps) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const category = categoryForBodyShape(bodyShape);
    setLoading(true);
    trackEvent('ufind_completed', { bodyShape, category });
    getProducts({ audience: 'women', category, sort: 'trending', limit: 24 })
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, [isOpen, bodyShape]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-white overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-black/50 mb-2">UFind</p>
            <h2 className="text-3xl">Looks for {bodyShape || 'your shape'}</h2>
            <p className="text-sm text-black/50 mt-2">
              Styling guidance only — not a fit guarantee. Shop partner retailers for final sizing.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-black/5 rounded-full" aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <ProductGrid products={products} loading={loading} />
      </div>
    </motion.div>
  );
}
