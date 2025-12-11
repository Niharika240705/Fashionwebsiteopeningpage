import { motion } from 'motion/react';
import { X, Heart, Share2, Bookmark } from 'lucide-react';
import { useState } from 'react';

interface FeedItem {
  id: number;
  image: string;
  title: string;
  category: string;
  tags: string[];
  designer?: string;
  priceRange: 'Luxury' | 'Mid' | 'Affordable';
}

// Mock feed data
const generateFeedItems = (): FeedItem[] => [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1736555142217-916540c7f1b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwb3V0Zml0JTIwY2FzdWFsfGVufDF8fHx8MTc2NTExMTk1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Casual Summer Vibes',
    category: 'Casual',
    tags: ['Summer', 'Daily'],
    designer: 'Zara',
    priceRange: 'Affordable'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1511742667815-af572199b23a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3RyZWV0d2VhciUyMHN0eWxlfGVufDF8fHx8MTc2NTIxNzM4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Urban Streetwear',
    category: 'Streetwear',
    tags: ['Winter', 'Daily'],
    designer: 'Off-White',
    priceRange: 'Luxury'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1761164920960-2d776a18998c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcGFydHklMjBkcmVzcyUyMGV2ZW5pbmd8ZW58MXx8fHwxNzY1MjE3MzgyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Evening Elegance',
    category: 'Party',
    tags: ['Winter', 'Party'],
    designer: 'Valentino',
    priceRange: 'Luxury'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1684259498917-b0cde0133e14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd29ya3dlYXIlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzY1MjE3MzgyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Professional Power',
    category: 'Workwear',
    tags: ['Office', 'Winter'],
    designer: 'Theory',
    priceRange: 'Mid'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1764740106926-173386bd55ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZXRobmljJTIwdHJhZGl0aW9uYWwlMjBvdXRmaXR8ZW58MXx8fHwxNzY1MjE3MzgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Traditional Charm',
    category: 'Ethnic',
    tags: ['Wedding', 'Festive'],
    designer: 'Sabyasachi',
    priceRange: 'Luxury'
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1658910453954-6ca847bb7470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwYWNjZXNzb3JpZXMlMjBqZXdlbHJ5fGVufDF8fHx8MTc2NTE3OTUyMHww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Statement Accessories',
    category: 'Accessories',
    tags: ['Party', 'Daily'],
    designer: 'Cartier',
    priceRange: 'Luxury'
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1610021703235-c1c46765133c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3VtbWVyJTIwb3V0Zml0JTIwYmVhY2h8ZW58MXx8fHwxNzY1MjE3MzgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Beach Getaway',
    category: 'Casual',
    tags: ['Summer', 'Vacation'],
    designer: 'Reformation',
    priceRange: 'Mid'
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1645606491757-bac7cd8e55b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd2ludGVyJTIwY29hdCUyMHN0eWxlfGVufDF8fHx8MTc2NTIxNzM4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Winter Warmth',
    category: 'Western',
    tags: ['Winter', 'Daily'],
    designer: 'Mango',
    priceRange: 'Affordable'
  },
  {
    id: 9,
    image: 'https://images.unsplash.com/photo-1654945959377-09e02acd5ff7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWxlYnJpdHklMjBmYXNoaW9uJTIwc3R5bGV8ZW58MXx8fHwxNzY1MTM1NDg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Celebrity Style',
    category: 'Party',
    tags: ['Party', 'Winter'],
    designer: 'Gucci',
    priceRange: 'Luxury'
  },
  {
    id: 10,
    image: 'https://images.unsplash.com/photo-1745284504844-7979176dc29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbWluaW1hbGlzdCUyMGNoaWN8ZW58MXx8fHwxNzY1MjE3Mzg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Minimalist Chic',
    category: 'Casual',
    tags: ['Daily', 'Office'],
    designer: 'COS',
    priceRange: 'Mid'
  },
];

interface UfindFeedProps {
  isOpen: boolean;
  bodyShape: string;
  onClose: () => void;
}

export function UfindFeed({ isOpen, bodyShape, onClose }: UfindFeedProps) {
  const [activeStyleFilter, setActiveStyleFilter] = useState('All');
  const [activeBudgetFilter, setActiveBudgetFilter] = useState('All');
  const [activeOccasionFilter, setActiveOccasionFilter] = useState('All');
  const [activeSeasonFilter, setActiveSeasonFilter] = useState('All');
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<number>>(new Set());

  const feedItems = generateFeedItems();

  const toggleLike = (id: number) => {
    const newLiked = new Set(likedItems);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedItems(newLiked);
  };

  const toggleSave = (id: number) => {
    const newSaved = new Set(savedItems);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedItems(newSaved);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-[60] overflow-y-auto"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-black/5 z-10">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 
                className="tracking-wide mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem' }}
              >
                Your Ufind Feed
              </h1>
              <p className="text-sm text-black/40 tracking-wider">
                Curated for {bodyShape} body shape
              </p>
            </div>
            <button
              onClick={onClose}
              className="hover:opacity-60 transition-opacity p-2"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Style Filter */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-xs tracking-widest text-black/40 uppercase shrink-0">Style:</span>
              {['All', 'Casual', 'Streetwear', 'Party', 'Workwear', 'Western', 'Ethnic'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveStyleFilter(filter)}
                  className={`px-4 py-2 rounded-full text-xs tracking-wider transition-all shrink-0 ${
                    activeStyleFilter === filter
                      ? 'bg-black text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Other Filters */}
            <div className="flex items-center gap-6 overflow-x-auto pb-2">
              {/* Budget */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs tracking-widest text-black/40 uppercase">Budget:</span>
                {['All', 'Luxury', 'Mid', 'Affordable'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveBudgetFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs tracking-wider transition-all ${
                      activeBudgetFilter === filter
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Season */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs tracking-widest text-black/40 uppercase">Season:</span>
                {['All', 'Summer', 'Winter'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveSeasonFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs tracking-wider transition-all ${
                      activeSeasonFilter === filter
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pinterest-style Masonry Grid */}
      <div className="max-w-[1800px] mx-auto px-8 py-12">
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {feedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="break-inside-avoid group relative"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer">
                {/* Image */}
                <div className="relative overflow-hidden aspect-[3/4]">
                  <motion.img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="flex gap-2 w-full">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleLike(item.id)}
                        className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                          likedItems.has(item.id) 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white/90 text-black'
                        }`}
                      >
                        <Heart size={18} fill={likedItems.has(item.id) ? 'currentColor' : 'none'} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleSave(item.id)}
                        className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                          savedItems.has(item.id)
                            ? 'bg-black text-white'
                            : 'bg-white/90 text-black'
                        }`}
                      >
                        <Bookmark size={18} fill={savedItems.has(item.id) ? 'currentColor' : 'none'} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white/90 rounded-full backdrop-blur-sm text-black"
                      >
                        <Share2 size={18} />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="tracking-wide">{item.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.priceRange === 'Luxury'
                          ? 'bg-amber-100 text-amber-800'
                          : item.priceRange === 'Mid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.priceRange}
                    </span>
                  </div>
                  <p className="text-sm text-black/60">{item.designer}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-neutral-100 rounded-full text-black/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
