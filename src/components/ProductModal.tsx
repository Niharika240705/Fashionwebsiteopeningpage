import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { trackExternalLink } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  images: string[];
  productUrl: string;
  sourceWebsite: string;
  trendScore: number;
  disclaimer: string;
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth?: () => void;
}

export function ProductModal({ product, isOpen, onClose, onRequireAuth }: ProductModalProps) {
  const { isAuthenticated } = useAuth();
  
  if (!product) return null;

  const handleExternalLinkClick = () => {
    trackExternalLink(product.productUrl, product.brand);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Close Button */}
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              {/* Image */}
              <div className="relative h-[28rem] bg-neutral-100 flex items-center justify-center overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x800?text=Product+Image';
                    }}
                  />
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
                
                {/* Discount Badge */}
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <div className="absolute top-6 left-6 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-md">
                    -{product.discountPercentage}% OFF
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="tracking-wider uppercase text-sm text-gray-500 font-semibold">{product.brand}</h2>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 capitalize">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="text-xl text-black font-medium leading-tight mb-4">{product.name}</h3>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-black">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-lg text-gray-400 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-black/40 tracking-wide uppercase">Source</span>
                    <span className="tracking-wide capitalize">{product.sourceWebsite.replace('https://www.', '').split('/')[0]}</span>
                  </div>
                  {product.trendScore > 50 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/40 tracking-wide uppercase">Trend Score</span>
                      <span className="tracking-wide text-green-600 font-semibold">{product.trendScore}/100</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {isAuthenticated ? (
                  <motion.a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleExternalLinkClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-black text-white py-4 rounded-full flex items-center justify-center gap-2 hover:bg-black/90 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
                    aria-label={`Visit official website`}
                  >
                    <span className="tracking-wider">BUY ON {product.sourceWebsite.replace('https://www.', '').split('/')[0].toUpperCase()}</span>
                    <ExternalLink size={16} aria-hidden="true" />
                  </motion.a>
                ) : (
                  <motion.button
                    onClick={() => {
                      onClose();
                      if (onRequireAuth) {
                        onRequireAuth();
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-black text-white py-4 rounded-full flex items-center justify-center gap-2 hover:bg-black/90 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
                  >
                    <span className="tracking-wider">LOGIN TO BUY THIS ITEM</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
