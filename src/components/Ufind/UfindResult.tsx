import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface UfindResultProps {
  isOpen: boolean;
  bodyShape: string;
  onViewFeed: () => void;
}

export function UfindResult({ isOpen, bodyShape, onViewFeed }: UfindResultProps) {
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
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
          />

          {/* Result Card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ 
                type: 'spring', 
                damping: 20, 
                stiffness: 200,
                delay: 0.1 
              }}
              className="bg-gradient-to-br from-white to-neutral-50 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div className="p-12 text-center space-y-8">
                {/* Icon Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    damping: 15, 
                    stiffness: 200,
                    delay: 0.3 
                  }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-black/5 rounded-full"
                >
                  <Sparkles size={36} className="text-black/80" strokeWidth={1.5} />
                </motion.div>

                {/* Result Text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <p className="text-sm tracking-[0.2em] uppercase text-black/40">
                    Your Body Shape is
                  </p>
                  <h2 
                    className="tracking-wider"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3rem' }}
                  >
                    {bodyShape}
                  </h2>
                </motion.div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-black/60 tracking-wide max-w-sm mx-auto"
                >
                  We've curated styles that flatter your natural proportions.
                </motion.p>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onViewFeed}
                  className="w-full bg-black text-white py-5 rounded-full hover:bg-black/90 transition-colors tracking-widest text-sm shadow-lg"
                >
                  VIEW MY UFIND FEED →
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
