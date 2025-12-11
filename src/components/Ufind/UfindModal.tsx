import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type BodyShape = 'Hourglass' | 'Pear' | 'Apple' | 'Rectangle' | 'Inverted Triangle' | 'Athletic';

interface UfindModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShapeSelect: (shape: BodyShape) => void;
  onStartQuestionnaire: () => void;
}

const bodyShapes: BodyShape[] = [
  'Hourglass',
  'Pear',
  'Apple',
  'Rectangle',
  'Inverted Triangle',
  'Athletic'
];

// Simple monochrome SVG icons for each body shape
const ShapeIcon = ({ shape }: { shape: BodyShape }) => {
  const icons: Record<BodyShape, JSX.Element> = {
    'Hourglass': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3v18M8 3h8M7 21h10M8 3c0 3-2 6-2 9s2 6 2 9M16 3c0 3 2 6 2 9s-2 6-2 9" strokeLinecap="round"/>
      </svg>
    ),
    'Pear': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3v18M10 3h4M8 21h8M10 3c0 2-1 4-1 6s0 4 0 6c0 2 1 4 3 6M14 3c0 2 1 4 1 6s0 4 0 6c0 2-1 4-3 6" strokeLinecap="round"/>
      </svg>
    ),
    'Apple': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="5" ry="7"/>
        <path d="M12 5v14M7 5h10M7 19h10" strokeLinecap="round"/>
      </svg>
    ),
    'Rectangle': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="3" width="8" height="18" rx="1"/>
        <line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
    ),
    'Inverted Triangle': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3v18M7 3h10M9 21h6M7 3c0 3 0 6 0 9s1 6 5 9M17 3c0 3 0 6 0 9s-1 6-5 9" strokeLinecap="round"/>
      </svg>
    ),
    'Athletic': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3v18M8.5 3h7M8.5 21h7M8.5 3c0 4 0 8 0 12s0.5 4 3.5 6M15.5 3c0 4 0 8 0 12s-0.5 4-3.5 6" strokeLinecap="round"/>
      </svg>
    ),
  };

  return <div className="w-12 h-12">{icons[shape]}</div>;
};

export function UfindModal({ isOpen, onClose, onShapeSelect, onStartQuestionnaire }: UfindModalProps) {
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {/* Close Button */}
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={onClose}
                  className="hover:opacity-60 transition-opacity p-2"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Content */}
              <div className="p-12">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mb-12"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem' }}
                >
                  Choose Your Body Shape
                </motion.h2>

                {/* Body Shape Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                  {bodyShapes.map((shape, index) => (
                    <motion.button
                      key={shape}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05, duration: 0.4 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onShapeSelect(shape)}
                      className="flex flex-col items-center gap-3 p-6 bg-neutral-50 hover:bg-neutral-100 rounded-2xl transition-all shadow-sm hover:shadow-md group"
                    >
                      <div className="text-black/60 group-hover:text-black transition-colors">
                        <ShapeIcon shape={shape} />
                      </div>
                      <span className="text-sm tracking-wide text-center">{shape}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Questionnaire Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <button
                    onClick={onStartQuestionnaire}
                    className="text-sm text-black/40 hover:text-black transition-colors tracking-wide"
                  >
                    Not sure about your body shape?{' '}
                    <span className="underline underline-offset-4">Find it here.</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
