import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface ChronicleArticle {
  id: number;
  title: string;
  image: string;
  teaser: string;
  date: string;
  readTime: string;
  category: string;
  fullContent: {
    heroImage: string;
    author: string;
    sections: {
      heading?: string;
      text: string;
      image?: string;
    }[];
  };
}

const chronicleArticles: ChronicleArticle[] = [
  {
    id: 1,
    title: 'The Psychology of Luxury: Why We Crave Designer Labels',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop',
    teaser: 'Exploring the deep emotional connection between identity and haute couture.',
    date: 'Dec 8, 2025',
    readTime: '12 min read',
    category: 'Fashion Psychology',
    fullContent: {
      heroImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=900&fit=crop',
      author: 'Dr. Eleanor Cross',
      sections: [
        {
          text: 'The allure of luxury fashion transcends mere materialism. At its core, our relationship with designer labels is deeply psychological, rooted in our fundamental human need for belonging, status, and self-expression. When we drape ourselves in Chanel, Hermès, or Dior, we\'re not just wearing fabric—we\'re wearing identity, aspiration, and narrative.',
        },
        {
          heading: 'The Status Signal',
          text: 'Evolutionary psychologists argue that luxury goods serve as modern-day peacock feathers—visible signals of resources, taste, and social positioning. A Birkin bag communicates more than wealth; it signals patience (the waiting list), knowledge (understanding the brand\'s heritage), and belonging to an exclusive club.',
        },
        {
          image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&h=800&fit=crop',
        },
        {
          heading: 'The Craftsmanship Connection',
          text: 'Beyond status, luxury fashion offers something increasingly rare in our mass-produced world: human touch. The 800 hours spent hand-stitching a Chanel jacket, the generational leatherworking expertise behind a Hermès saddle stitch—these details create emotional bonds between wearer and maker.',
        },
        {
          text: 'This connection to craftsmanship satisfies our psychological need for authenticity and permanence in an ephemeral digital age. Owning a piece that will outlast trends becomes an anchor of stability.',
        },
      ],
    },
  },
  {
    id: 2,
    title: 'Coco Chanel and the Birth of Modern Femininity',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
    teaser: 'How one woman liberated fashion from corsets and redefined power dressing.',
    date: 'Dec 5, 2025',
    readTime: '15 min read',
    category: 'Fashion History',
    fullContent: {
      heroImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&h=900&fit=crop',
      author: 'Isabelle Laurent',
      sections: [
        {
          text: 'In 1926, Gabrielle "Coco" Chanel introduced a simple black dress to the world. Vogue called it "Chanel\'s Ford"—comparing it to the Model T for its democratic elegance. But this wasn\'t just a dress. It was a revolution in fabric form.',
        },
        {
          heading: 'Breaking the Corset',
          text: 'Before Chanel, fashion was a prison. Literal boning constricted women\'s bodies, symbolizing their constricted social roles. Chanel\'s jersey knits, borrowed from men\'s underwear, offered unprecedented freedom of movement—and by extension, freedom of being.',
        },
        {
          image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=1200&h=800&fit=crop',
        },
        {
          heading: 'The Power of Simplicity',
          text: 'Chanel understood that true luxury isn\'t about ornamentation—it\'s about confidence. Her designs stripped away excess, revealing the woman beneath. The little black dress, the Breton stripe, the classic bouclé jacket: these pieces didn\'t scream wealth. They whispered power.',
        },
      ],
    },
  },
  {
    id: 3,
    title: 'The True Cost of Fast Fashion: A Sustainability Reckoning',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea1f0efe?w=800&h=600&fit=crop',
    teaser: 'Behind the $5 dress: environmental collapse and the future of ethical style.',
    date: 'Dec 2, 2025',
    readTime: '18 min read',
    category: 'Sustainability',
    fullContent: {
      heroImage: 'https://images.unsplash.com/photo-1558769132-cb1aea1f0efe?w=1600&h=900&fit=crop',
      author: 'Maya Chen',
      sections: [
        {
          text: 'The fashion industry produces 10% of global carbon emissions—more than all international flights and maritime shipping combined. The average person now buys 60% more clothing than in 2000, yet each item is kept for half as long. We\'re drowning in cheap clothes while the planet burns.',
        },
        {
          heading: 'The Water Crisis',
          text: 'A single cotton t-shirt requires 2,700 liters of water to produce—enough drinking water for one person for 2.5 years. Textile dyeing is the second-largest polluter of water globally, with toxic chemicals flowing directly into rivers that communities depend on for survival.',
        },
        {
          image: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=1200&h=800&fit=crop',
        },
        {
          heading: 'A Path Forward',
          text: 'But change is possible. Brands like Patagonia, Stella McCartney, and Reformation are proving that style and sustainability can coexist. Regenerative agriculture, closed-loop recycling, and transparent supply chains offer glimpses of a different future—one where fashion enhances rather than destroys the world.',
        },
      ],
    },
  },
  {
    id: 4,
    title: 'Virgil Abloh: The Renaissance Man Who Redefined Luxury',
    image: 'https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=800&h=600&fit=crop',
    teaser: 'How a Chicago architect became fashion\'s most influential disruptor.',
    date: 'Nov 29, 2025',
    readTime: '14 min read',
    category: 'Cultural Impact',
    fullContent: {
      heroImage: 'https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=1600&h=900&fit=crop',
      author: 'Marcus Johnson',
      sections: [
        {
          text: 'When Virgil Abloh walked into Louis Vuitton as its first Black artistic director in 2018, he brought more than streetwear credibility. He brought a radical philosophy: luxury should be accessible, art should be collaborative, and fashion should speak to everyone—not just the 1%.',
        },
        {
          heading: 'The Quote Marks Philosophy',
          text: 'Abloh\'s signature quotation marks weren\'t just graphic design—they were conceptual commentary. By putting "SCULPTURE" on a sweater or "WOMAN" on a dress, he asked: who decides what these words mean? Who has the power to define art, fashion, identity?',
        },
        {
          image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&h=800&fit=crop',
        },
        {
          heading: 'Legacy Beyond Fashion',
          text: 'Abloh proved that the path to luxury doesn\'t require European pedigree or fashion school lineage. An architecture degree, DJ sets, Kanye collaborations—all valid. His message to young creatives of color was clear: these spaces are yours too. Not as guests, but as architects of the future.',
        },
      ],
    },
  },
];

export function FashionChronicle() {
  const [selectedArticle, setSelectedArticle] = useState<ChronicleArticle | null>(null);

  return (
    <>
      <section className="py-16 sm:py-20 px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto">
        <div className="mb-8 sm:mb-12">
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] sm:tracking-[0.3em] mb-3 sm:mb-4 text-black/90"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: '0.3em',
            }}
          >
            THE FASHION CHRONICLE
          </h2>
          <p className="text-black/60 max-w-2xl text-xs sm:text-sm" style={{ fontWeight: 300 }}>
            Deep reads on fashion, culture, history, psychology, and luxury.
          </p>
        </div>

        {/* Chronicle Grid */}
        <div className="overflow-x-auto pb-4 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
          <div className="flex gap-4 sm:gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 min-w-max md:min-w-0">
            {chronicleArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ 
                  delay: index * 0.1, 
                  duration: 0.6, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                whileHover={{ scale: 1.03, y: -8 }}
                className="w-72 sm:w-80 md:w-auto bg-black rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all overflow-hidden group cursor-pointer"
                onClick={() => setSelectedArticle(article)}
              >
                {/* Image */}
                <div className="relative h-56 sm:h-64 overflow-hidden bg-neutral-100">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                    <span className="inline-block px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] tracking-wider text-white bg-black border border-white/20 rounded-full">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-white/40 tracking-wider">
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 
                    className="text-lg sm:text-xl leading-tight text-white"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {article.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60 line-clamp-2" style={{ fontWeight: 300 }}>
                    {article.teaser}
                  </p>
                  <motion.div
                    className="flex items-center gap-2 text-xs sm:text-sm tracking-wider pt-1 sm:pt-2 text-white/70 group-hover:text-white group-hover:underline transition-colors"
                    animate={{ x: 0 }}
                    whileHover={{ x: 5 }}
                  >
                    <span>Read More</span>
                    <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                  </motion.div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Full Article Modal */}
      {selectedArticle && (
        <motion.div
          className="fixed inset-0 bg-white z-[200] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedArticle(null)}
            className="fixed top-6 sm:top-8 right-6 sm:right-8 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
            aria-label="Close article"
          >
            <span className="text-xl sm:text-2xl">&times;</span>
          </button>

          {/* Article Content */}
          <article className="max-w-4xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
            {/* Hero Image */}
            <motion.div
              className="relative h-64 sm:h-96 md:h-[500px] -mx-6 sm:-mx-8 mb-8 sm:mb-12 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src={selectedArticle.fullContent.heroImage}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </motion.div>

            {/* Meta & Title */}
            <div className="mb-8 sm:mb-12 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-black/40 tracking-widest uppercase">
                <span>{selectedArticle.category}</span>
                <span>•</span>
                <span>{selectedArticle.date}</span>
                <span>•</span>
                <span>{selectedArticle.readTime}</span>
              </div>

              <h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight text-black/90"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {selectedArticle.title}
              </h1>

              <p className="text-base sm:text-lg text-black/70 italic" style={{ fontWeight: 300 }}>
                By {selectedArticle.fullContent.author}
              </p>
            </div>

            {/* Article Sections */}
            <div className="space-y-6 sm:space-y-8">
              {selectedArticle.fullContent.sections.map((section, index) => (
                <div key={index}>
                  {section.heading && (
                    <h2 
                      className="text-2xl sm:text-3xl mb-3 sm:mb-4 text-black/90"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {section.heading}
                    </h2>
                  )}
                  
                  {section.text && (
                    <p 
                      className="text-base sm:text-lg leading-relaxed text-black/80 mb-4 sm:mb-6"
                      style={{ fontWeight: 300, lineHeight: 1.8 }}
                    >
                      {section.text}
                    </p>
                  )}

                  {section.image && (
                    <div className="my-8 sm:my-12 -mx-6 sm:-mx-8">
                      <img
                        src={section.image}
                        alt="Article visual"
                        className="w-full h-64 sm:h-80 md:h-[400px] object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-black/10 text-center">
              <button
                onClick={() => setSelectedArticle(null)}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-black text-white tracking-wider text-xs sm:text-sm hover:bg-black/90 transition-colors rounded-full"
              >
                Back to Chronicle
              </button>
            </div>
          </article>
        </motion.div>
      )}
    </>
  );
}