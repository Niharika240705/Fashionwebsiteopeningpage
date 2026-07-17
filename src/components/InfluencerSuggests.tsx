import { motion } from 'motion/react';
import { useState } from 'react';
import chanelImage from '../assets/9001957e229e27a8068455211b50aa8c01ee7c5c.png';

interface InfluencerBlock {
  id: number;
  name: string;
  lookCaption: string;
  brands: string[];
  profileImage: string;
  column: 'left' | 'right';
  heightPx: number; // natural height
  order: number; // vertical position in column
}

const influencerBlocks: InfluencerBlock[] = [
  {
    id: 1,
    name: 'Olivia Sterling',
    lookCaption: 'Parisian Elegance Meets Modern Minimalism',
    brands: ['Chanel', 'Hermès'],
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
    column: 'left',
    heightPx: 520,
    order: 1,
  },
  {
    id: 2,
    name: 'Isabella Chen',
    lookCaption: 'Understated Luxury in Neutral Tones',
    brands: ['The Row', 'Toteme'],
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=400&fit=crop',
    column: 'right',
    heightPx: 380,
    order: 1,
  },
  {
    id: 3,
    name: 'Sophia Laurent',
    lookCaption: 'Bold Maximalism for the Modern Woman',
    brands: ['Valentino', 'Prada'],
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop',
    column: 'left',
    heightPx: 560,
    order: 2,
  },
  {
    id: 4,
    name: 'Emma Rosewood',
    lookCaption: 'Effortless Chic: The Art of Casual Elegance',
    brands: ['Reformation', 'Ganni'],
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
    column: 'right',
    heightPx: 540,
    order: 2,
  },
  {
    id: 5,
    name: 'Aria Martinez',
    lookCaption: 'Street Luxe: Urban Edge Meets High Fashion',
    brands: ['Off-White', 'Acne Studios'],
    profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=400&fit=crop',
    column: 'left',
    heightPx: 400,
    order: 3,
  },
  {
    id: 6,
    name: 'Lily Nakamura',
    lookCaption: 'Timeless Tailoring in Monochrome',
    brands: ['Max Mara', 'Jil Sander'],
    profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&h=500&fit=crop',
    column: 'right',
    heightPx: 480,
    order: 3,
  },
  {
    id: 7,
    name: 'Grace Morgan',
    lookCaption: 'Bohemian Luxury: Free-Spirited Elegance',
    brands: ['Chloé', 'Isabel Marant'],
    profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
    column: 'left',
    heightPx: 580,
    order: 4,
  },
  {
    id: 8,
    name: 'Charlotte Hayes',
    lookCaption: 'Editorial Edge: High Fashion Drama',
    brands: ['Dior', 'Saint Laurent'],
    profileImage: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=400&fit=crop',
    column: 'right',
    heightPx: 370,
    order: 4,
  },
  {
    id: 9,
    name: 'Victoria Blake',
    lookCaption: 'Modern Romance in Delicate Silhouettes',
    brands: ['Zimmermann', 'Self-Portrait'],
    profileImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=700&fit=crop',
    column: 'left',
    heightPx: 500,
    order: 5,
  },
  {
    id: 10,
    name: 'Diana Park',
    lookCaption: 'Urban Sophistication in Tailored Lines',
    brands: ['Theory', 'COS'],
    profileImage: 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600&h=400&fit=crop',
    column: 'right',
    heightPx: 360,
    order: 5,
  },
];

export function InfluencerSuggests() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const leftColumnBlocks = influencerBlocks.filter(block => block.column === 'left').sort((a, b) => a.order - b.order);
  const rightColumnBlocks = influencerBlocks.filter(block => block.column === 'right').sort((a, b) => a.order - b.order);

  return (
    <section className="relative min-h-screen bg-white py-16 sm:py-20 md:py-24">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 mb-12 sm:mb-16">
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] sm:tracking-[0.3em] text-black/90"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.3em',
          }}
        >
          INFLUENCER SUGGESTS
        </h2>
      </div>

      {/* Two Column Editorial Layout */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20">
          
          {/* LEFT COLUMN - FIXED CHANEL HERO IMAGE */}
          <div className="lg:sticky lg:top-24 lg:self-start h-[500px] sm:h-[600px] md:h-[700px] lg:h-[850px]">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full w-full overflow-hidden rounded-lg lg:rounded-none"
            >
              <img
                src={chanelImage}
                alt="Luxury Fashion Influencer Editorial"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </motion.div>
          </div>

          {/* RIGHT COLUMN - PINTEREST 2-COLUMN MASONRY (1 column on mobile) */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-[4%]">
            {/* Left Masonry Column */}
            <div className="w-full sm:w-[48%] space-y-6 sm:space-y-8">
              {leftColumnBlocks.map((influencer, index) => (
                <motion.article
                  key={influencer.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ 
                    delay: index * 0.08, 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  onHoverStart={() => setHoveredId(influencer.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  className="cursor-pointer group"
                >
                  {/* Image - Auto height, full width, no cropping */}
                  <motion.div 
                    className="relative overflow-hidden shadow-lg bg-white mb-7"
                    style={{ 
                      width: '100%',
                      height: `${influencer.heightPx}px`,
                    }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Real image - maintains full visible area */}
                    <img
                      src={influencer.profileImage}
                      alt={influencer.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Text Below - Never overlaid */}
                  <div className="px-1">
                    <h3 
                      className="text-xl md:text-2xl mb-2 text-black leading-tight"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {influencer.name}
                    </h3>
                    
                    <p className="text-xs text-black/60 mb-3 leading-relaxed" style={{ fontWeight: 300 }}>
                      {influencer.lookCaption}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {influencer.brands.map((brand) => (
                        <span
                          key={brand}
                          className="inline-block px-2 py-1 text-[10px] tracking-wider text-black/70 border border-black/10"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>

                    <motion.div
                      className="inline-flex items-center gap-2 text-[10px] tracking-wider text-black/50 group-hover:text-black transition-colors"
                      animate={{ x: hoveredId === influencer.id ? 6 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span>View Look</span>
                      <span>&rarr;</span>
                    </motion.div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Right Masonry Column */}
            <div className="w-full sm:w-[48%] space-y-6 sm:space-y-8" style={{ marginTop: '60px' }}>
              {rightColumnBlocks.map((influencer, index) => (
                <motion.article
                  key={influencer.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ 
                    delay: index * 0.08, 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  onHoverStart={() => setHoveredId(influencer.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  className="cursor-pointer group"
                >
                  {/* Image - Auto height, full width, no cropping */}
                  <motion.div 
                    className="relative overflow-hidden shadow-lg bg-white mb-7"
                    style={{ 
                      width: '100%',
                      height: `${influencer.heightPx}px`,
                    }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Real image - maintains full visible area */}
                    <img
                      src={influencer.profileImage}
                      alt={influencer.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Text Below - Never overlaid */}
                  <div className="px-1">
                    <h3 
                      className="text-xl md:text-2xl mb-2 text-black leading-tight"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {influencer.name}
                    </h3>
                    
                    <p className="text-xs text-black/60 mb-3 leading-relaxed" style={{ fontWeight: 300 }}>
                      {influencer.lookCaption}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {influencer.brands.map((brand) => (
                        <span
                          key={brand}
                          className="inline-block px-2 py-1 text-[10px] tracking-wider text-black/70 border border-black/10"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>

                    <motion.div
                      className="inline-flex items-center gap-2 text-[10px] tracking-wider text-black/50 group-hover:text-black transition-colors"
                      animate={{ x: hoveredId === influencer.id ? 6 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span>View Look</span>
                      <span>&rarr;</span>
                    </motion.div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}