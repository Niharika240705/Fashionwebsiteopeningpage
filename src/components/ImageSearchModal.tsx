import { motion, AnimatePresence } from 'motion/react';
import { X, Camera } from 'lucide-react';
import { useState } from 'react';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageSearchModal({ isOpen, onClose }: ImageSearchModalProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file upload logic here
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
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between">
                <h2 
                  className="text-2xl tracking-wide"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Image Search
                </h2>
                <button
                  onClick={onClose}
                  className="hover:opacity-60 transition-opacity p-2"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Upload Area */}
              <div className="p-8">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    isDragging
                      ? 'border-black/40 bg-black/5'
                      : 'border-black/10 bg-neutral-50/50 hover:border-black/20 hover:bg-neutral-50'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: isDragging ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center">
                      <Camera size={28} strokeWidth={1.5} className="text-black/60" />
                    </div>
                    <div>
                      <p className="tracking-wide mb-2">
                        Upload outfit image to find similar styles
                      </p>
                      <p className="text-sm text-black/40 tracking-wide">
                        Drag & drop or click to browse
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="px-6 py-3 bg-black text-white rounded-full text-sm tracking-wider hover:bg-black/90 transition-colors cursor-pointer"
                    >
                      Choose File
                    </label>
                  </motion.div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-black/30 tracking-wide">
                    Supported formats: JPG, PNG, WEBP (Max 10MB)
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
