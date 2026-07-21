import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { getDesigners } from '../utils/api';
import { Designer } from '../types/designer';
import { trackEvent } from '../utils/analytics';

/**
 * Premium editorial directory for Indian designer houses. Designers are
 * fetched live from `GET /api/designers` — the DB is the source of truth,
 * so adding a new designer later never requires a frontend change.
 */
export function DesignersPage() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSpecialization, setActiveSpecialization] = useState<string>('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    trackEvent('designers_directory_viewed', {});
    getDesigners()
      .then((data) => {
        if (cancelled) return;
        setDesigners(data.designers || []);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load designers');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Specialization filter chips are derived live from the fetched roster —
  // never a hardcoded list — so new specialization tags show up automatically.
  const specializations = useMemo(() => {
    const set = new Set<string>();
    designers.forEach((d) => d.specializations?.forEach((s) => set.add(s)));
    return ['All', ...Array.from(set).sort()];
  }, [designers]);

  const filteredDesigners = useMemo(() => {
    return designers.filter((d) => {
      const matchesSpecialization =
        activeSpecialization === 'All' || d.specializations?.includes(activeSpecialization);
      const matchesQuery =
        !query.trim() ||
        d.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        d.shortDescription.toLowerCase().includes(query.trim().toLowerCase());
      return matchesSpecialization && matchesQuery;
    });
  }, [designers, activeSpecialization, query]);

  const featuredDesigners = filteredDesigners.filter((d) => d.featured);
  const otherDesigners = filteredDesigners.filter((d) => !d.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Editorial hero */}
      <section className="relative overflow-hidden bg-black text-white">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,255,255,0.12), transparent), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(255,255,255,0.06), transparent)',
          }}
        />
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-white/50 mb-6"
          >
            Persona Presents
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-4xl sm:text-6xl md:text-7xl leading-[1.05] max-w-4xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            The Designer Directory
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed"
          >
            India&rsquo;s most celebrated couturiers and heritage ateliers — bridal
            lehengas, hand-embroidered sherwanis, and couture that defines a
            generation. Discover the houses behind the craft.
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 -mt-8 sm:-mt-10 relative z-10">
        <div className="bg-white border border-black/10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.3)] px-5 sm:px-8 py-6 sm:py-7">
          <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search designers…"
              className="w-full md:w-64 border-b border-black/20 bg-transparent py-2 text-sm outline-none focus:border-black/60 transition-colors"
            />
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setActiveSpecialization(spec)}
                  className={`px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase border transition-colors ${
                    activeSpecialization === spec
                      ? 'bg-black text-white border-black'
                      : 'border-black/15 text-black/60 hover:border-black/40 hover:text-black'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-14 sm:py-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600 py-16 text-center">{error}</p>
        ) : !filteredDesigners.length ? (
          <p className="text-black/50 py-16 text-center">
            No designers match your filters yet.
          </p>
        ) : (
          <div className="space-y-16 sm:space-y-24">
            {featuredDesigners.length > 0 && (
              <div>
                <h2 className="text-[11px] tracking-[0.3em] uppercase text-black/40 mb-6">
                  Featured Houses
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {featuredDesigners.map((designer, index) => (
                    <DesignerCard key={designer.id} designer={designer} index={index} large />
                  ))}
                </div>
              </div>
            )}

            {otherDesigners.length > 0 && (
              <div>
                <h2 className="text-[11px] tracking-[0.3em] uppercase text-black/40 mb-6">
                  All Designers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {otherDesigners.map((designer, index) => (
                    <DesignerCard key={designer.id} designer={designer} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DesignerCard({
  designer,
  index,
  large,
}: {
  designer: Designer;
  index: number;
  large?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: (index % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/designers/${designer.slug}`}
        onClick={() => trackEvent('designer_card_clicked', { slug: designer.slug })}
        className="group block relative overflow-hidden bg-neutral-100"
      >
        <div className={`relative ${large ? 'aspect-[16/10]' : 'aspect-[4/5]'} overflow-hidden`}>
          <img
            src={designer.coverImageUrl}
            alt={designer.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white">
            {designer.metadata?.city && (
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/60 mb-2">
                {designer.metadata.city}
              </p>
            )}
            <h3
              className={`${large ? 'text-3xl sm:text-4xl' : 'text-2xl'} leading-tight mb-2`}
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {designer.name}
            </h3>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed line-clamp-2 mb-4 max-w-md">
              {designer.shortDescription}
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {designer.specializations.slice(0, 3).map((spec) => (
                  <span
                    key={spec}
                    className="text-[10px] tracking-[0.12em] uppercase px-2 py-1 border border-white/25 text-white/80"
                  >
                    {spec}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase shrink-0 group-hover:gap-2 transition-all">
                View Collection
                <ArrowUpRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
