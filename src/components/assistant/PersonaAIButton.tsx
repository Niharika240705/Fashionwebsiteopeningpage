import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PersonaAIButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function PersonaAIButton({ isOpen, onClick }: PersonaAIButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close Persona AI assistant' : 'Open Persona AI assistant'}
      className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-[96] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black text-white flex items-center justify-center shadow-xl group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isOpen ? 'close' : 'open'}
          initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          {isOpen ? (
            <X size={22} strokeWidth={1.5} />
          ) : (
            <MessageCircle size={22} strokeWidth={1.5} />
          )}
        </motion.span>
      </AnimatePresence>

      {!isOpen && (
        <span
          className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black text-white text-[10px] tracking-[0.2em] uppercase px-3 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block"
        >
          Persona AI
        </span>
      )}
    </motion.button>
  );
}
