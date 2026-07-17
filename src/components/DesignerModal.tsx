import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { trackExternalLink } from '../utils/analytics';
import { LazyImage } from './LazyImage';
import { useAuth } from '../contexts/AuthContext';

interface Outfit {
  id: number;
  image: string;
  designer: string;
  tag: 'Luxury' | 'Mid-Luxury' | 'Affordable';
  description: string;
  website: string;
  priceRange: string;
}

interface DesignerModalProps {
  outfit: Outfit | null;
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth?: () => void;
}

export function DesignerModal({ outfit, isOpen, onClose, onRequireAuth }: DesignerModalProps) {
  const { isAuthenticated } = useAuth();
  
  if (!outfit) return null;

  const handleExternalLinkClick = () => {
    const url = `https://${outfit.website}`;
    trackExternalLink(url, outfit.designer);
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
              <div className="relative h-96 bg-neutral-100">
                <LazyImage
                  src={outfit.image}
                  alt={`${outfit.designer} - ${outfit.description}`}
                  className="w-full h-full"
                />
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="tracking-wider">{outfit.designer}</h2>
                    <span
                      className={`px-4 py-1 rounded-full text-xs tracking-wider ${
                        outfit.tag === 'Luxury'
                          ? 'bg-amber-100 text-amber-800'
                          : outfit.tag === 'Mid-Luxury'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {outfit.tag}
                    </span>
                  </div>
                  <p className="text-black/60">{outfit.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-black/40 tracking-wide">PRICE RANGE</span>
                    <span className="tracking-wide">{outfit.priceRange}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black/40 tracking-wide">WEBSITE</span>
                    <span className="tracking-wide">{outfit.website}</span>
                  </div>
                </div>

                {/* CTA Button */}
                {isAuthenticated ? (
                  <motion.a
                    href={`https://${outfit.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleExternalLinkClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-black text-white py-4 rounded-full flex items-center justify-center gap-2 hover:bg-black/90 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
                    aria-label={`Visit ${outfit.designer} official website`}
                  >
                    <span className="tracking-wider">VISIT OFFICIAL WEBSITE</span>
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
                    <span className="tracking-wider">LOGIN TO VISIT WEBSITE</span>
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
