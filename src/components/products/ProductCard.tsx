import type { MouseEvent } from 'react';
import { Bookmark, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductSummary } from '../../types/product';
import { getRedirectUrl } from '../../utils/api';
import { useSavedItems } from '../../contexts/SavedItemsContext';
import { trackEvent } from '../../utils/analytics';

interface ProductCardProps {
  product: ProductSummary;
  placement?: string;
}

export function ProductCard({ product, placement = 'grid' }: ProductCardProps) {
  const { isSaved, toggleSave } = useSavedItems();
  const image =
    product.images?.[0] ||
    'https://via.placeholder.com/600x800?text=Product+Image+Unavailable';

  const handleBuy = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.offerId) return;
    trackEvent('affiliate_click', {
      productId: product.id,
      offerId: product.offerId,
      placement,
      retailer: product.retailerId,
    });
    window.open(getRedirectUrl(product.offerId, placement), '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="group bg-white border border-black/5 overflow-hidden">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave(product);
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white"
            aria-label={isSaved(product.id) ? 'Remove saved item' : 'Save item'}
          >
            <Bookmark size={16} fill={isSaved(product.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </Link>

      <div className="p-4 space-y-2">
        <p className="text-[11px] tracking-[0.2em] uppercase text-black/50">{product.brand}</p>
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold">
            ₹{product.price.toLocaleString()}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-black/40 line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-xs text-black/50">{product.sellerName || product.attributionText}</p>
        <button
          type="button"
          onClick={handleBuy}
          disabled={!product.offerId}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 border border-black px-3 py-2 text-xs tracking-widest uppercase hover:bg-black hover:text-white disabled:opacity-40"
        >
          Go to retailer
          <ExternalLink size={12} />
        </button>
      </div>
    </article>
  );
}
