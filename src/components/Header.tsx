import { Search, Menu, Bookmark, Mic, Camera, X, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function Header({ 
  onMenuClick, 
  onUfindClick, 
  onSavedClick,
  onImageSearchClick,
  onLoginClick,
  onSearchSubmit,
}: { 
  onMenuClick: () => void; 
  onUfindClick: () => void;
  onSavedClick: () => void;
  onImageSearchClick: () => void;
  onLoginClick: () => void;
  onSearchSubmit?: (query: string) => void;
}) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const submitSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    onSearchSubmit?.(q);
    setSearchExpanded(false);
  };
  // Determine if header should be in scrolled state
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Use same threshold as PersonaLogo: 15% of viewport
      const threshold = window.innerHeight * 0.15;
      setIsScrolled(window.scrollY > threshold);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVoiceSearch = () => {
    setIsVoiceActive(true);
    setTimeout(() => setIsVoiceActive(false), 2000);
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/5"
      animate={{
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
      }}
      transition={{ duration: 0.6, ease: [0.45, 0, 0.55, 1] }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 flex items-center justify-between gap-3 sm:gap-4 md:gap-6">
        {/* Left: Menu Icon */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={onMenuClick} 
            className="hover:opacity-60 transition-opacity p-1"
            aria-label="Open menu"
          >
            <Menu size={20} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
          </button>
        </div>

        {/* Center: Search Bar (visible at top, hides on scroll) OR PersonaLogo (when scrolled) */}
        <motion.div 
          className="hidden sm:flex items-center gap-2 sm:gap-3 border border-black/20 rounded-full px-4 sm:px-6 py-2 sm:py-3 bg-white"
          style={{
            maxWidth: '600px',
            width: '100%',
          }}
          animate={{
            opacity: isScrolled ? 0 : 1,
            scale: isScrolled ? 0.85 : 1,
            y: isScrolled ? -8 : 0,
            pointerEvents: isScrolled ? 'none' : 'auto',
          }}
          transition={{ duration: 0.6, ease: [0.45, 0, 0.55, 1] }}
        >
          <Search size={16} className="sm:w-[18px] sm:h-[18px] text-black/40 shrink-0" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
            placeholder="Search for winter wedding outfits, designers, brands…"
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm"
            disabled={isScrolled}
          />
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <motion.button
              onClick={handleVoiceSearch}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 sm:p-1.5 hover:bg-black/5 rounded-full transition-colors relative"
              aria-label="Voice search"
              disabled={isScrolled}
            >
              <Mic size={16} className="sm:w-[18px] sm:h-[18px] text-black/60" strokeWidth={1.5} />
              {isVoiceActive && (
                <motion.div
                  className="absolute inset-0 bg-black/10 rounded-full"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={onImageSearchClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 sm:p-1.5 hover:bg-black/5 rounded-full transition-colors"
              aria-label="Image search"
              disabled={isScrolled}
            >
              <Camera size={16} className="sm:w-[18px] sm:h-[18px] text-black/60" strokeWidth={1.5} />
            </motion.button>
          </div>
        </motion.div>

        {/* Right: Search Icon, Ufind & About */}
        <nav className="flex items-center gap-3 sm:gap-4 md:gap-6 shrink-0">
          {/* Search Icon (appears on scroll for desktop, always visible on mobile) */}
          <motion.button
            onClick={() => setSearchExpanded(true)}
            className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
            aria-label="Search"
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: isScrolled ? 1 : window.innerWidth < 640 ? 1 : 0,
              scale: isScrolled ? 1 : window.innerWidth < 640 ? 1 : 0.5,
            }}
            transition={{ duration: 0.6, ease: [0.45, 0, 0.55, 1] }}
          >
            <Search size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} />
          </motion.button>

          <Link
            to="/designers"
            className="hidden sm:inline text-[10px] sm:text-xs md:text-sm tracking-widest hover:opacity-60 transition-opacity"
          >
            DESIGNERS
          </Link>

          <button 
            onClick={onUfindClick}
            className="text-[10px] sm:text-xs md:text-sm tracking-widest hover:opacity-60 transition-opacity"
          >
            UFIND
          </button>
          
          {/* Bookmark Button */}
          <motion.button
            onClick={() => {
              setIsBookmarked(!isBookmarked);
              onSavedClick();
            }}
            className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
            aria-label="Saved items"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bookmark 
              size={18} 
              className="sm:w-5 sm:h-5" 
              strokeWidth={1.5}
              fill={isBookmarked ? "currentColor" : "none"}
            />
          </motion.button>
          
          {/* Login/Account Icon */}
          <motion.button
            onClick={onLoginClick}
            className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
            aria-label="Account"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserCircle 
              size={18} 
              className="sm:w-5 sm:h-5" 
              strokeWidth={1.5}
            />
          </motion.button>
        </nav>
      </div>

      {/* Search Overlay (when search icon clicked) */}
      {searchExpanded && (
        <motion.div
          className="fixed inset-0 bg-white/98 backdrop-blur-md z-[100] flex items-start justify-center pt-20 sm:pt-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full max-w-3xl px-6 sm:px-8">
            <div className="flex items-center gap-3 border-b-2 border-black/20 pb-4">
              <Search size={20} className="sm:w-6 sm:h-6 text-black/40 shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
                placeholder="Search for winter wedding outfits, designers, brands…"
                className="flex-1 bg-transparent outline-none text-base sm:text-lg"
                autoFocus
              />
              
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <motion.button
                  onClick={handleVoiceSearch}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors relative"
                  aria-label="Voice search"
                >
                  <Mic size={18} className="sm:w-5 sm:h-5 text-black/60" strokeWidth={1.5} />
                </motion.button>

                <motion.button
                  onClick={onImageSearchClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
                  aria-label="Image search"
                >
                  <Camera size={18} className="sm:w-5 sm:h-5 text-black/60" strokeWidth={1.5} />
                </motion.button>

                <motion.button
                  onClick={() => setSearchExpanded(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors ml-1 sm:ml-2"
                  aria-label="Close search"
                >
                  <X size={20} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}