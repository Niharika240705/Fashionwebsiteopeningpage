import type { MouseEvent } from 'react';
import { Bookmark, ExternalLink, Shirt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductSummary } from '../../types/product';
import { getRedirectUrl } from '../../utils/api';
import { useSavedItems } from '../../contexts/SavedItemsContext';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { priceToBudgetTier } from '../../utils/budget';

interface ProductCardProps {
  product: ProductSummary;
  placement?: string;
  onTryOn?: (product: ProductSummary) => void;
  onRequireAuth?: () => void;
  /** Label for the buy/redirect button — e.g. "View Original" on designer collection pages. */
  buyLabel?: string;
  /** Show the product's collection name (designer collection pages) instead of just the brand. */
  showCollection?: boolean;
}

function isTryOnEligible(product: ProductSummary): boolean {
  const category = (product.category || '').toLowerCase();
  const blocked = ['jewellery', 'jewelry', 'bags', 'accessories', 'footwear'];
  return !blocked.includes(category);
}

export function ProductCard({
  product,
  placement = 'grid',
  onTryOn,
  onRequireAuth,
  buyLabel = 'Go to retailer',
  showCollection = false,
}: ProductCardProps) {
  const { isSaved, toggleSave } = useSavedItems();
  const { isAuthenticated } = useAuth();
  const image =
    product.images?.[0] ||
    'https://via.placeholder.com/600x800?text=Product+Image+Unavailable';

  const canBuy = Boolean(product.offerId || product.productUrl);
  const budgetTier = priceToBudgetTier(product.price);
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercentage =
    product.discountPercentage ??
    (hasDiscount
      ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
      : undefined);

  const handleBuy = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canBuy) return;

    trackEvent('affiliate_click', {
      productId: product.id,
      offerId: product.offerId,
      placement,
      retailer: product.retailerId,
      direct: !product.offerId,
    });

    const url = product.offerId
      ? getRedirectUrl(product.offerId, placement)
      : product.productUrl!;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTryOn = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    trackEvent('try_on_started', { productId: product.id, category: product.category });
    onTryOn?.(product);
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
        <p className="text-[11px] tracking-[0.2em] uppercase text-black/50">
          {showCollection && product.metadata?.collectionName ? product.metadata.collectionName : product.brand}
        </p>
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        </Link>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-semibold">₹{product.price.toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-xs text-black/40 line-through">
              ₹{product.originalPrice!.toLocaleString()}
            </span>
          )}
          {discountPercentage ? (
            <span className="text-xs font-medium text-rose-600">{discountPercentage}% off</span>
          ) : null}
        </div>
        {budgetTier && (
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase ${budgetTier.colorClassName}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${budgetTier.dotClassName}`} />
            {budgetTier.label}
          </span>
        )}
        <p className="text-xs text-black/50">{product.sellerName || product.attributionText}</p>
        <div className="space-y-2 pt-1">
          {isTryOnEligible(product) && (
            <button
              type="button"
              onClick={handleTryOn}
              className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-3 py-2 text-xs tracking-widest uppercase"
            >
              <Shirt size={12} />
              Try on
            </button>
          )}
          <button
            type="button"
            onClick={handleBuy}
            disabled={!canBuy}
            className="w-full inline-flex items-center justify-center gap-2 border border-black px-3 py-2 text-xs tracking-widest uppercase hover:bg-black hover:text-white disabled:opacity-40"
          >
            {buyLabel}
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </article>
  );
}
