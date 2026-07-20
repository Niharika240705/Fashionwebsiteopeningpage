import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, ExternalLink, Shirt } from 'lucide-react';
import { getProduct, getRedirectUrl } from '../utils/api';
import { ProductSummary } from '../types/product';
import { useSavedItems } from '../contexts/SavedItemsContext';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../utils/analytics';
import { VirtualTryOnModal } from '../components/VirtualTryOnModal';
import { priceToBudgetTier } from '../utils/budget';

interface ProductPageProps {
  onRequireAuth?: () => void;
}

export function ProductPage({ onRequireAuth }: ProductPageProps) {
  const { id = '' } = useParams();
  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const { isSaved, toggleSave } = useSavedItems();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    getProduct(id)
      .then((data) => {
        setProduct(data.product);
        trackEvent('product_viewed', { productId: id });
      })
      .catch((err) => setError(err.message || 'Product not found'));
  }, [id]);

  if (error) {
    return <p className="max-w-[1600px] mx-auto px-8 py-20 text-red-600">{error}</p>;
  }

  if (!product) {
    return <div className="max-w-[1600px] mx-auto px-8 py-20 animate-pulse h-96 bg-neutral-100" />;
  }

  const images = product.images?.length
    ? product.images
    : ['https://via.placeholder.com/600x800?text=Product+Image+Unavailable'];

  const audience = product.audience || 'women';
  const tryOnEligible = !['jewellery', 'jewelry', 'bags', 'accessories', 'footwear'].includes(
    (product.category || '').toLowerCase()
  );

  const canBuy = Boolean(product.offerId || product.productUrl);
  const budgetTier = priceToBudgetTier(product.price);
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercentage =
    product.discountPercentage ??
    (hasDiscount
      ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
      : undefined);

  const handleBuy = () => {
    if (!canBuy) return;
    trackEvent('affiliate_click', {
      productId: product.id,
      offerId: product.offerId,
      placement: 'product_detail',
      direct: !product.offerId,
    });
    const url = product.offerId
      ? getRedirectUrl(product.offerId, 'product_detail')
      : product.productUrl!;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTryOn = () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    trackEvent('try_on_started', { productId: product.id, category: product.category });
    setTryOnOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14">
      <Link
        to={`/${audience}/${product.category}`}
        className="text-xs tracking-widest uppercase text-black/50"
      >
        ← Back to {product.category}
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-[3/4] bg-neutral-100 overflow-hidden mb-3">
            <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={img + index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`w-16 h-20 shrink-0 border ${index === activeImage ? 'border-black' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <p className="text-xs tracking-[0.2em] uppercase text-black/50">{product.brand}</p>
          <h1 className="text-3xl md:text-4xl">{product.name}</h1>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-semibold">₹{product.price.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-black/40 line-through">
                ₹{product.originalPrice!.toLocaleString()}
              </span>
            )}
            {discountPercentage ? (
              <span className="text-sm font-medium text-rose-600">{discountPercentage}% off</span>
            ) : null}
          </div>
          {budgetTier && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase ${budgetTier.colorClassName}`}
            >
              <span className={`w-2 h-2 rounded-full ${budgetTier.dotClassName}`} />
              {budgetTier.label}
            </span>
          )}

          <p className="text-sm text-black/60">
            {product.attributionText || `Sold by ${product.sellerName || 'partner retailer'}`}
          </p>
          <p className="text-xs text-black/45">
            Price and availability may change on the retailer site.
          </p>
          <p className="text-xs text-black/45">
            {product.disclosureText ||
              'We may earn a commission when you buy through links on our site.'}
          </p>

          {product.metadata?.description && (
            <p className="text-sm leading-relaxed text-black/70">{product.metadata.description}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {tryOnEligible && (
              <button
                type="button"
                onClick={handleTryOn}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs tracking-widest uppercase"
              >
                <Shirt size={14} />
                Try on
              </button>
            )}
            <button
              type="button"
              onClick={handleBuy}
              disabled={!canBuy}
              className="inline-flex items-center gap-2 border border-black px-6 py-3 text-xs tracking-widest uppercase disabled:opacity-40"
            >
              Go to {product.sellerName || 'retailer'}
              <ExternalLink size={14} />
            </button>
            <button
              type="button"
              onClick={() => toggleSave(product)}
              className="inline-flex items-center gap-2 border border-black/20 px-6 py-3 text-xs tracking-widest uppercase"
            >
              <Bookmark size={14} fill={isSaved(product.id) ? 'currentColor' : 'none'} />
              {isSaved(product.id) ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <VirtualTryOnModal
        isOpen={tryOnOpen}
        product={product}
        onClose={() => setTryOnOpen(false)}
      />
    </div>
  );
}
