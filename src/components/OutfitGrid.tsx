import { motion } from 'motion/react';
import { useState } from 'react';
import { DesignerModal } from './DesignerModal';
import { Bookmark } from 'lucide-react';
import { LazyImage } from './LazyImage';

interface Outfit {
  id: number;
  image: string;
  designer: string;
  tag: 'Luxury' | 'Mid-Luxury' | 'Affordable';
  description: string;
  website: string;
  priceRange: string;
}

const outfits: Outfit[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1670431492581-a46ed324f2a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29tYW4lMjB3aW50ZXIlMjB3ZWRkaW5nJTIwb3V0Zml0fGVufDF8fHx8MTc2NTIxNTc2NXww&ixlib=rb-4.1.0&q=80&w=1080',
    designer: 'Valentino',
    tag: 'Luxury',
    description: 'Elegant winter wedding ensemble with silk organza details',
    website: 'valentino.com',
    priceRange: '$5,000 - $15,000',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1704775986777-b903cf6b9802?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmYXNoaW9uJTIwZGVzaWduZXIlMjBjbG90aGluZ3xlbnwxfHx8fDE3NjUyMTU3NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    designer: 'Dior',
    tag: 'Luxury',
    description: 'Haute couture velvet evening gown',
    website: 'dior.com',
    priceRange: '$8,000 - $20,000',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1761574028262-6d834741bfd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZm9ybWFsJTIwZHJlc3MlMjBlbGVnYW50fGVufDF8fHx8MTc2NTIxNTc2Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    designer: 'Reformation',
    tag: 'Mid-Luxury',
    description: 'Sustainable silk formal dress with elegant draping',
    website: 'thereformation.com',
    priceRange: '$500 - $1,500',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1599681906238-c4f97c8b4454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3RyZWV0d2VhciUyMGNhc3VhbHxlbnwxfHx8fDE3NjUyMTU3Njd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    designer: 'Mango',
    tag: 'Affordable',
    description: 'Contemporary casual winter outfit',
    website: 'mango.com',
    priceRange: '$100 - $300',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1761574028714-7c2882992a9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZXZlbmluZyUyMGdvd24lMjBwYXJ0eXxlbnwxfHx8fDE3NjUyMTU3Njd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    designer: 'Zimmermann',
    tag: 'Mid-Luxury',
    description: 'Flowing evening gown with intricate embellishments',
    website: 'zimmermannwear.com',
    priceRange: '$1,000 - $3,000',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1756483510900-ec43edbafb45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwdHJhZGl0aW9uYWwlMjBldGhuaWMlMjB3ZWFyfGVufDF8fHx8MTc2NTIxNTc2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    designer: 'Sabyasachi',
    tag: 'Luxury',
    description: 'Traditional bridal wear with modern silhouette',
    website: 'sabyasachi.com',
    priceRange: '$3,000 - $12,000',
  },
];

export function OutfitGrid({ onSaveOutfit, onRequireAuth }: { onSaveOutfit?: (outfit: Outfit) => void; onRequireAuth?: () => void }) {
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<Set<number>>(new Set());

  const handleSave = (e: React.MouseEvent, outfit: Outfit) => {
    e.stopPropagation();
    const newSaved = new Set(savedOutfits);
    if (newSaved.has(outfit.id)) {
      newSaved.delete(outfit.id);
    } else {
      newSaved.add(outfit.id);
      if (onSaveOutfit) {
        onSaveOutfit(outfit);
      }
    }
    setSavedOutfits(newSaved);
  };

  return (
    <>
      <section className="py-20 px-8 max-w-[1600px] mx-auto">
        <h2 className="tracking-widest mb-4 text-black/40">WINTER WEDDING OUTFITS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {outfits.map((outfit) => {
            const isSaved = savedOutfits.has(outfit.id);
            return (
              <motion.div
                key={outfit.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOutfit(outfit)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedOutfit(outfit);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${outfit.designer} ${outfit.description}`}
                className="cursor-pointer group relative focus:outline-none focus:ring-2 focus:ring-black/20 rounded-2xl"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg aspect-[3/4] bg-neutral-100">
                  <LazyImage
                    src={outfit.image}
                    alt={`${outfit.designer} - ${outfit.description}`}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Bookmark Button */}
                  <motion.button
                    onClick={(e) => handleSave(e, outfit)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isSaved ? `Remove ${outfit.designer} from saved` : `Save ${outfit.designer}`}
                    className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      isSaved 
                        ? 'bg-black text-white shadow-lg' 
                        : 'bg-white/90 text-black hover:bg-white'
                    }`}
                  >
                    <Bookmark 
                      size={18} 
                      fill={isSaved ? 'currentColor' : 'none'}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </motion.button>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <div className="text-white">
                      <h3 className="tracking-wide mb-1">{outfit.designer}</h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs tracking-wider ${
                          outfit.tag === 'Luxury'
                            ? 'bg-amber-500/20 text-amber-200'
                            : outfit.tag === 'Mid-Luxury'
                            ? 'bg-blue-500/20 text-blue-200'
                            : 'bg-green-500/20 text-green-200'
                        }`}
                      >
                        {outfit.tag}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <DesignerModal
        outfit={selectedOutfit}
        isOpen={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
        onRequireAuth={onRequireAuth}
      />
    </>
  );
}