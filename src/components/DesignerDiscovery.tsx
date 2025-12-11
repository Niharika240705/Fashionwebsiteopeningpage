import { motion } from 'motion/react';
import { useState } from 'react';

type FilterType = 'All' | 'Luxury' | 'Mid-Luxury' | 'Affordable';

interface Designer {
  id: number;
  name: string;
  category: 'Luxury' | 'Mid-Luxury' | 'Affordable';
  website: string;
  specialty: string;
}

const designers: Designer[] = [
  { id: 1, name: 'Chanel', category: 'Luxury', website: 'chanel.com', specialty: 'Haute Couture' },
  { id: 2, name: 'Gucci', category: 'Luxury', website: 'gucci.com', specialty: 'Italian Luxury' },
  { id: 3, name: 'Prada', category: 'Luxury', website: 'prada.com', specialty: 'Modern Elegance' },
  { id: 4, name: 'Reformation', category: 'Mid-Luxury', website: 'thereformation.com', specialty: 'Sustainable Fashion' },
  { id: 5, name: 'Zimmermann', category: 'Mid-Luxury', website: 'zimmermannwear.com', specialty: 'Australian Luxury' },
  { id: 6, name: 'Ganni', category: 'Mid-Luxury', website: 'ganni.com', specialty: 'Scandinavian Cool' },
  { id: 7, name: 'Zara', category: 'Affordable', website: 'zara.com', specialty: 'Fast Fashion' },
  { id: 8, name: 'Mango', category: 'Affordable', website: 'mango.com', specialty: 'Contemporary Style' },
  { id: 9, name: 'COS', category: 'Affordable', website: 'cosstores.com', specialty: 'Minimalist Design' },
];

export function DesignerDiscovery() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const filteredDesigners = activeFilter === 'All' 
    ? designers 
    : designers.filter(d => d.category === activeFilter);

  return (
    <section className="py-20 px-8 max-w-[1600px] mx-auto bg-neutral-50">
      <div className="mb-12">
        <h2 className="tracking-widest mb-4">DISCOVER DESIGNERS & BRANDS</h2>
        <p className="text-black/60 max-w-2xl">
          Explore curated collections from the world's leading fashion houses and emerging designers
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-12 flex-wrap">
        {['All', 'Luxury', 'Mid-Luxury', 'Affordable'].map((filter) => (
          <motion.button
            key={filter}
            onClick={() => setActiveFilter(filter as FilterType)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-full tracking-wider text-sm transition-all ${
              activeFilter === filter
                ? 'bg-black text-white'
                : 'bg-white hover:bg-neutral-100'
            }`}
          >
            {filter}
          </motion.button>
        ))}
      </div>

      {/* Designer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDesigners.map((designer) => (
          <motion.a
            key={designer.id}
            href={`https://${designer.website}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="tracking-wide">{designer.name}</h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    designer.category === 'Luxury'
                      ? 'bg-amber-100 text-amber-800'
                      : designer.category === 'Mid-Luxury'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {designer.category}
                </span>
              </div>
              <p className="text-sm text-black/60">{designer.specialty}</p>
              <div className="text-xs text-black/40 tracking-wider pt-2">
                {designer.website}
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
