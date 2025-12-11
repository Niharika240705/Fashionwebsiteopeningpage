import { X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavedItem {
  id: number;
  image: string;
  title: string;
  designer: string;
  priceRange: 'Luxury' | 'Mid' | 'Affordable';
}

interface SavedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedItem[];
  onRemove: (id: number) => void;
}

export function SavedPanel({ isOpen, onClose, savedItems, onRemove }: SavedPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Slide-in Panel from Right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] lg:w-[450px] z-50 bg-[#f8f6f3] shadow-2xl rounded-l-3xl overflow-hidden"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {/* Film grain texture */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Header */}
            <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between relative">
              <h2 
                className="text-2xl tracking-wide"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Saved Styles
              </h2>
              <button
                onClick={onClose}
                className="hover:opacity-60 transition-opacity p-2"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Saved Items List */}
            <div className="overflow-y-auto h-[calc(100vh-88px)] px-8 py-6 space-y-4 relative">
              {savedItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <p className="text-black/40 tracking-wide">No saved items yet</p>
                  <p className="text-sm text-black/30 mt-2">
                    Start saving your favorite looks
                  </p>
                </motion.div>
              ) : (
                savedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Image Thumbnail */}
                      <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="tracking-wide mb-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-black/60 mb-2">
                            {item.designer}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full inline-block ${
                              item.priceRange === 'Luxury'
                                ? 'bg-amber-100 text-amber-800'
                                : item.priceRange === 'Mid'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.priceRange}
                          </span>
                        </div>

                        {/* Remove Button (appears on hover) */}
                        <motion.button
                          initial={{ opacity: 0 }}
                          whileHover={{ scale: 1.1 }}
                          className="self-end opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item.id);
                          }}
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
