import { X, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavedItem {
  id: number | string;
  image: string;
  title: string;
  designer: string;
  priceRange: 'Luxury' | 'Mid' | 'Affordable';
  offerId?: string;
}

interface SavedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedItem[];
  onRemove: (id: number | string) => void;
  onOpenItem?: (item: SavedItem) => void;
}

export function SavedPanel({ isOpen, onClose, savedItems, onRemove, onOpenItem }: SavedPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] lg:w-[450px] z-50 bg-[#f8f6f3] shadow-2xl rounded-l-3xl overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between relative">
              <h2 className="text-2xl tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Saved Styles
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="h-[calc(100%-88px)] overflow-y-auto px-6 py-4 space-y-4">
              {savedItems.length === 0 ? (
                <p className="text-sm text-black/50 py-10 text-center">
                  No saved styles yet. Browse women’s categories to bookmark looks.
                </p>
              ) : (
                savedItems.map((item) => (
                  <div key={String(item.id)} className="flex gap-3 bg-white/70 p-3 rounded-xl">
                    <img src={item.image} alt={item.title} className="w-20 h-28 object-cover rounded-lg bg-neutral-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-widest text-black/40">{item.designer}</p>
                      <h3 className="text-sm font-medium line-clamp-2">{item.title}</h3>
                      <div className="flex gap-2 mt-3">
                        {item.offerId && (
                          <button
                            type="button"
                            onClick={() => onOpenItem?.(item)}
                            className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase border border-black px-2 py-1"
                          >
                            Retailer <ExternalLink size={10} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemove(item.id)}
                          className="p-1 text-black/50 hover:text-black"
                          aria-label="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
