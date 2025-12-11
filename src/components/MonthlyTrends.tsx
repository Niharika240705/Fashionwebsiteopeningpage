import { motion } from 'motion/react';
import { useState } from 'react';
import newspaperImage from 'figma:asset/5c11e6d90c23a297f8dcaca6caf3a4b238514587.png';

interface TrendBlock {
  id: number;
  headline: string;
  description: string;
  tag: string;
  column: 'left' | 'right';
  heightPx: number; // natural height
  order: number; // vertical position in column
}

const trendBlocks: TrendBlock[] = [
  {
    id: 1,
    headline: 'The New Power Suit',
    description: 'Oversized tailoring meets feminine silhouettes in this season\'s reimagined suiting.',
    tag: 'Runway',
    column: 'left',
    heightPx: 480,
    order: 1,
  },
  {
    id: 2,
    headline: 'Ethereal Bridal',
    description: 'Delicate lace and flowing fabrics define modern bridal elegance.',
    tag: 'Bridal',
    column: 'right',
    heightPx: 420,
    order: 1,
  },
  {
    id: 3,
    headline: 'Street Minimalism',
    description: 'Clean lines and neutral tones dominate the urban landscape.',
    tag: 'Street',
    column: 'left',
    heightPx: 540,
    order: 2,
  },
  {
    id: 4,
    headline: 'Couture Drama',
    description: 'Bold architectural shapes return to haute couture runways.',
    tag: 'Couture',
    column: 'right',
    heightPx: 380,
    order: 2,
  },
  {
    id: 5,
    headline: 'Vintage Revival',
    description: 'Seventies silhouettes reimagined for contemporary wardrobes.',
    tag: 'Runway',
    column: 'left',
    heightPx: 460,
    order: 3,
  },
  {
    id: 6,
    headline: 'Romantic Textures',
    description: 'Ruffles, pleats, and draping create movement.',
    tag: 'Runway',
    column: 'right',
    heightPx: 520,
    order: 3,
  },
  {
    id: 7,
    headline: 'Monochrome Majesty',
    description: 'All-black ensembles showcase the power of simplicity.',
    tag: 'Street',
    column: 'left',
    heightPx: 400,
    order: 4,
  },
  {
    id: 8,
    headline: 'The Return of Red',
    description: 'Scarlet shades make a bold statement across all categories.',
    tag: 'Runway',
    column: 'right',
    heightPx: 440,
    order: 4,
  },
  {
    id: 9,
    headline: 'Luxury Knitwear',
    description: 'Cashmere and wool dominate fall collections.',
    tag: 'Street',
    column: 'left',
    heightPx: 500,
    order: 5,
  },
  {
    id: 10,
    headline: 'Bold Accessories',
    description: 'Statement pieces elevate minimal looks.',
    tag: 'Runway',
    column: 'right',
    heightPx: 360,
    order: 5,
  },
];

export function MonthlyTrends() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const leftColumnBlocks = trendBlocks.filter(block => block.column === 'left').sort((a, b) => a.order - b.order);
  const rightColumnBlocks = trendBlocks.filter(block => block.column === 'right').sort((a, b) => a.order - b.order);

  return (
    <section className="relative min-h-screen bg-neutral-50 py-16 sm:py-20 md:py-24">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 mb-12 sm:mb-16">
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] sm:tracking-[0.3em] text-black/90"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.3em',
          }}
        >
          MONTHLY TRENDS
        </h2>
      </div>

      {/* Two Column Editorial Layout */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20">
          
          {/* LEFT COLUMN - FIXED EDITORIAL HERO IMAGE */}
          <div className="lg:sticky lg:top-24 lg:self-start h-[500px] sm:h-[600px] md:h-[700px] lg:h-[850px]">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full w-full overflow-hidden rounded-lg lg:rounded-none"
            >
              <img
                src={newspaperImage}
                alt="Fashion Editorial"
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
              {leftColumnBlocks.map((trend, index) => (
                <motion.article
                  key={trend.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ 
                    delay: index * 0.08, 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  onHoverStart={() => setHoveredId(trend.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  className="cursor-pointer group"
                >
                  {/* Image - Auto height, full width, no cropping */}
                  <motion.div 
                    className="relative overflow-hidden shadow-md bg-neutral-100 mb-5 sm:mb-7 rounded-lg sm:rounded-none"
                    style={{ 
                      width: '100%',
                      height: `${Math.min(trend.heightPx, 400)}px`, // Limit height on mobile
                    }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Image placeholder - maintains full visible area */}
                    <div className="w-full h-full bg-gradient-to-br from-neutral-200 via-neutral-140 to-neutral-100" />
                  </motion.div>

                  {/* Text Below - Never overlaid */}
                  <div className="px-1">
                    <span className="inline-block px-2 py-1 mb-2 sm:mb-3 text-[9px] sm:text-[10px] tracking-[0.2em] text-black/60 border border-black/10">
                      {trend.tag.toUpperCase()}
                    </span>
                    
                    <h3 
                      className="text-lg sm:text-xl md:text-2xl mb-2 text-black leading-tight"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {trend.headline}
                    </h3>
                    
                    <p className="text-xs text-black/60 leading-relaxed" style={{ fontWeight: 300 }}>
                      {trend.description}
                    </p>

                    <motion.div
                      className="inline-flex items-center gap-2 mt-2 sm:mt-3 text-[9px] sm:text-[10px] tracking-wider text-black/50 group-hover:text-black transition-colors"
                      animate={{ x: hoveredId === trend.id ? 6 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span>Read Story</span>
                      <span>&rarr;</span>
                    </motion.div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Right Masonry Column - Hidden on small mobile, visible from sm up */}
            <div className="hidden sm:block w-[48%] space-y-8" style={{ marginTop: '60px' }}>
              {rightColumnBlocks.map((trend, index) => (
                <motion.article
                  key={trend.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ 
                    delay: index * 0.08, 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  onHoverStart={() => setHoveredId(trend.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  className="cursor-pointer group"
                >
                  {/* Image - Auto height, full width, no cropping */}
                  <motion.div 
                    className="relative overflow-hidden shadow-md bg-neutral-100 mb-7"
                    style={{ 
                      width: '100%',
                      height: `${trend.heightPx}px`,
                    }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Image placeholder - maintains full visible area */}
                    <div className="w-full h-full bg-gradient-to-br from-neutral-200 via-neutral-140 to-neutral-100" />
                  </motion.div>

                  {/* Text Below - Never overlaid */}
                  <div className="px-1">
                    <span className="inline-block px-2 py-1 mb-3 text-[10px] tracking-[0.2em] text-black/60 border border-black/10">
                      {trend.tag.toUpperCase()}
                    </span>
                    
                    <h3 
                      className="text-xl md:text-2xl mb-2 text-black leading-tight"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {trend.headline}
                    </h3>
                    
                    <p className="text-xs text-black/60 leading-relaxed" style={{ fontWeight: 300 }}>
                      {trend.description}
                    </p>

                    <motion.div
                      className="inline-flex items-center gap-2 mt-3 text-[10px] tracking-wider text-black/50 group-hover:text-black transition-colors"
                      animate={{ x: hoveredId === trend.id ? 6 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span>Read Story</span>
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