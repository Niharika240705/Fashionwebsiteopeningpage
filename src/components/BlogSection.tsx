import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  image: string;
  excerpt: string;
  date: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Winter Wedding Trends 2025',
    image: 'https://images.unsplash.com/photo-1612694831362-d0f69f3bcf2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwYmxvZyUyMHdpbnRlciUyMHRyZW5kc3xlbnwxfHx8fDE3NjUyMTU3Njh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    excerpt: 'Discover the hottest winter wedding fashion trends that will make you stand out this season.',
    date: 'Dec 1, 2025',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'Luxury vs Budget Bridal Wear',
    image: 'https://images.unsplash.com/photo-1639244151653-7807947de5a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbWFnYXppbmUlMjBlZGl0b3JpYWx8ZW58MXx8fHwxNzY1MTQyNzYyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    excerpt: 'A comprehensive guide to finding the perfect bridal wear that fits your style and budget.',
    date: 'Nov 28, 2025',
    readTime: '7 min read',
  },
  {
    id: 3,
    title: 'How to Style Ethnic Wear in Winter',
    image: 'https://images.unsplash.com/photo-1756483510900-ec43edbafb45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwdHJhZGl0aW9uYWwlMjBldGhuaWMlMjB3ZWFyfGVufDF8fHx8MTc2NTIxNTc2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    excerpt: 'Expert tips on layering and accessorizing traditional outfits for cold weather elegance.',
    date: 'Nov 25, 2025',
    readTime: '6 min read',
  },
  {
    id: 4,
    title: 'Men\'s Winter Wedding Fashion Guide',
    image: 'https://images.unsplash.com/photo-1599681906238-c4f97c8b4454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3RyZWV0d2VhciUyMGNhc3VhbHxlbnwxfHx8fDE3NjUyMTU3Njd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    excerpt: 'From classic tuxedos to contemporary suits, find the perfect winter wedding attire for men.',
    date: 'Nov 22, 2025',
    readTime: '4 min read',
  },
];

export function BlogSection() {
  return (
    <section className="py-20 px-8 max-w-[1600px] mx-auto">
      <div className="mb-12">
        <h2 className="tracking-widest mb-4">FASHION INSIGHTS</h2>
        <p className="text-black/60 max-w-2xl">
          Stay inspired with expert styling tips, trend forecasts, and fashion guides
        </p>
      </div>

      {/* Blog Grid - Horizontal Scroll on Mobile */}
      <div className="overflow-x-auto pb-4 -mx-8 px-8">
        <div className="flex gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 min-w-max md:min-w-0">
          {blogPosts.map((post) => (
            <motion.article
              key={post.id}
              whileHover={{ y: -8 }}
              className="w-80 md:w-auto bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden bg-neutral-100">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-black/40 tracking-wider">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="tracking-wide">{post.title}</h3>
                <p className="text-sm text-black/60 line-clamp-2">{post.excerpt}</p>
                <motion.div
                  className="flex items-center gap-2 text-sm tracking-wider pt-2 group-hover:gap-3 transition-all"
                  whileHover={{ x: 5 }}
                >
                  <span>Read More</span>
                  <ArrowRight size={16} />
                </motion.div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
