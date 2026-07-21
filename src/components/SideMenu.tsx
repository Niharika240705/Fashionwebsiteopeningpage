import { X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Audience, getCategoryOptionsForAudience } from '../utils/taxonomy';

type MainCategory = 'Women' | 'Men' | 'Kids' | null;

const moodImages = [
  'https://images.unsplash.com/photo-1719518411339-5158cea86caf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbHV4dXJ5JTIwZWRpdG9yaWFsfGVufDF8fHx8MTc2NTIxNjQ0NHww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1649217708362-4368faa2559b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdoJTIwZmFzaGlvbiUyMG1vZGVsJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1MjE2NDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1575201046471-082b5c1a1e79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmYXNoaW9uJTIwYWNjZXNzb3JpZXN8ZW58MXx8fHwxNzY1MTcwODg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1731512702625-03fa99b30be4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMGNsb3RoaW5nJTIwZWxlZ2FudHxlbnwxfHx8fDE3NjUyMTY0NDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1762430815620-fcca603c240c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcnVud2F5JTIwY291dHVyZXxlbnwxfHx8fDE3NjUyMTY0NDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1567357244786-35edb9b5e9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzaG9lcyUyMGJhZ3N8ZW58MXx8fHwxNzY1MjE2NDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080',
];

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

const AUDIENCE_PATH: Record<Exclude<MainCategory, null>, string> = {
  Women: 'women',
  Men: 'men',
  Kids: 'kids',
};

export function SideMenu({ isOpen, onClose, onNavigate }: SideMenuProps) {
  const [selectedMain, setSelectedMain] = useState<MainCategory>(null);
  const [imageTransition, setImageTransition] = useState(false);

  const audienceSlug: Audience = selectedMain ? (AUDIENCE_PATH[selectedMain] as Audience) : 'women';
  // Pulled live from the shared taxonomy (kept in sync with the AI
  // categorizer's registry), never a hardcoded/stale list.
  const categories = getCategoryOptionsForAudience(audienceSlug);

  const handleMainClick = (category: MainCategory) => {
    setImageTransition(true);
    setTimeout(() => {
      setSelectedMain(category);
      setImageTransition(false);
    }, 200);
  };

  const handleBack = () => {
    setImageTransition(true);
    setTimeout(() => {
      setSelectedMain(null);
      setImageTransition(false);
    }, 200);
  };

  const openCategory = (slug: string) => {
    onNavigate?.(`/${audienceSlug}/${slug}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with soft blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Side Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 bottom-0 w-full md:w-[85vw] lg:w-[75vw] max-w-[1400px] z-50 flex shadow-2xl"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {/* Left Panel - Navigation (100% on mobile, 35% on desktop) */}
            <div className="w-full md:w-[35%] bg-[#f8f6f3] overflow-y-auto relative">
              {/* Film grain texture overlay */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Header */}
              <div className="px-6 sm:px-10 md:px-12 py-8 sm:py-10 border-b border-black/5 flex items-center justify-between relative">
                {selectedMain ? (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleBack}
                    className="text-[10px] sm:text-xs tracking-[0.25em] hover:opacity-60 transition-opacity uppercase"
                  >
                    ← Back
                  </motion.button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-black/50"
                  >
                    Menu
                  </motion.div>
                )}
                <button onClick={onClose} className="hover:opacity-60 transition-opacity">
                  <X size={18} className="sm:w-5 sm:h-5" strokeWidth={1} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 sm:px-10 md:px-12 py-12 sm:py-16">
                {!selectedMain && (
                  <div className="space-y-8">
                    <motion.h2 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-black/30 mb-8 sm:mb-12"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Select Category
                    </motion.h2>
                    <div className="space-y-4 sm:space-y-5">
                      {['Women', 'Men', 'Kids'].map((category, index) => (
                        <motion.button
                          key={category}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          onClick={() => handleMainClick(category as MainCategory)}
                          whileHover={{ x: 4 }}
                          className="w-full group text-left"
                        >
                          <div className="flex items-center justify-between py-4 sm:py-5 border-b border-black/5">
                            <span 
                              className="text-xl sm:text-2xl tracking-wide transition-all"
                              style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                              {category}
                            </span>
                            <motion.div
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              whileHover={{ x: 3 }}
                            >
                              <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={1.5} />
                            </motion.div>
                          </div>
                        </motion.button>
                      ))}
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + 3 * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => {
                          onNavigate?.('/designers');
                          onClose();
                        }}
                        whileHover={{ x: 4 }}
                        className="w-full group text-left"
                      >
                        <div className="flex items-center justify-between py-4 sm:py-5 border-b border-black/5">
                          <span
                            className="text-xl sm:text-2xl tracking-wide transition-all"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                          >
                            Designers
                          </span>
                          <motion.div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ x: 3 }}
                          >
                            <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={1.5} />
                          </motion.div>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                )}

                {selectedMain && (
                  <div className="space-y-6">
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-black/30 mb-8 sm:mb-12"
                    >
                      {selectedMain}
                    </motion.h2>
                    {/* Full category list is loaded live from the shared
                        taxonomy (same registry the AI categorizer uses), so
                        new/updated categories show up automatically. */}
                    <div className="space-y-2">
                      {categories.map(({ slug, label }, index) => (
                        <motion.button
                          key={slug}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.03 + index * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          onClick={() => openCategory(slug)}
                          whileHover={{ x: 3 }}
                          className="w-full group text-left py-3 sm:py-4 px-4 sm:px-6 hover:bg-black/3 transition-all"
                          style={{ borderRadius: '0.5rem' }}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="tracking-wider text-xs sm:text-sm"
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              {label}
                            </span>
                            <motion.div
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              whileHover={{ x: 3 }}
                            >
                              <ChevronRight size={14} strokeWidth={1.5} />
                            </motion.div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Mood Board (65-70%) - Hidden on Mobile */}
            <div className="hidden md:block w-[65%] bg-[#f5f3f0] overflow-hidden relative">
              {/* Film grain texture */}
              <div 
                className="absolute inset-0 opacity-[0.04] pointer-events-none z-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Image Grid with transition overlay */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedMain}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageTransition ? 0.3 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="grid grid-cols-2 gap-6 p-12 h-full content-start"
                >
                  {moodImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.2 + index * 0.1, 
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      whileHover={{ scale: 1.03, transition: { duration: 0.4 } }}
                      className="relative overflow-hidden rounded-xl aspect-[4/5] bg-neutral-200/50 shadow-lg group cursor-pointer"
                    >
                      <img 
                        src={image} 
                        alt={`Mood ${index + 1}`}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-105"
                      />
                      
                      {/* Subtle overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Optional text overlay on hover */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="absolute bottom-0 left-0 right-0 p-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      >
                        <div className="text-xs tracking-[0.2em] uppercase">
                          Collection {index + 1}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}