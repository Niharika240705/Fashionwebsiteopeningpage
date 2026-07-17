import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Audience } from '../../utils/taxonomy';

export type WomenBodyShape =
  | 'Hourglass'
  | 'Pear'
  | 'Apple'
  | 'Rectangle'
  | 'Inverted Triangle'
  | 'Athletic';

export type MenBodyShape =
  | 'Trapezoid'
  | 'Triangle'
  | 'Inverted Triangle'
  | 'Oval'
  | 'Rectangle'
  | 'Athletic';

export type BodyShape = WomenBodyShape | MenBodyShape;

interface UfindModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShapeSelect: (shape: BodyShape, audience: Audience) => void;
  onStartQuestionnaire: (audience: Audience) => void;
  requireAuth?: boolean;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
}

const womenShapes: WomenBodyShape[] = [
  'Hourglass',
  'Pear',
  'Apple',
  'Rectangle',
  'Inverted Triangle',
  'Athletic',
];

const menShapes: MenBodyShape[] = [
  'Trapezoid',
  'Triangle',
  'Inverted Triangle',
  'Oval',
  'Rectangle',
  'Athletic',
];

const ShapeIcon = ({ shape }: { shape: string }) => (
  <div className="w-12 h-12 flex items-center justify-center border border-black/15 text-[10px] tracking-widest uppercase">
    {shape.slice(0, 2)}
  </div>
);

export function UfindModal({
  isOpen,
  onClose,
  onShapeSelect,
  onStartQuestionnaire,
  requireAuth = true,
  isAuthenticated = false,
  onRequireAuth,
}: UfindModalProps) {
  const [audience, setAudience] = useState<Audience>('women');
  const shapes = audience === 'men' ? menShapes : womenShapes;

  const guard = (action: () => void) => {
    if (requireAuth && !isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    action();
  };

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
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-black/50 mb-2">UFind</p>
                  <h2 className="text-2xl md:text-3xl">Discover your body type</h2>
                  <p className="text-sm text-black/55 mt-2">
                    Answer a short questionnaire or pick a shape. Guidance only — not a fit guarantee.
                    Sign in required.
                  </p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-black/5" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                {(['women', 'men'] as Audience[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAudience(option)}
                    className={`px-4 py-2 text-xs tracking-widest uppercase border ${
                      audience === option ? 'bg-black text-white border-black' : 'border-black/20'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => guard(() => onStartQuestionnaire(audience))}
                className="w-full mb-6 border border-black px-4 py-3 text-xs tracking-widest uppercase hover:bg-black hover:text-white"
              >
                Start questionnaire
              </button>

              <p className="text-xs tracking-[0.2em] uppercase text-black/45 mb-3">Or select a shape</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {shapes.map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => guard(() => onShapeSelect(shape, audience))}
                    className="border border-black/10 p-4 text-left hover:border-black transition-colors"
                  >
                    <ShapeIcon shape={shape} />
                    <p className="mt-3 text-sm font-medium">{shape}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
