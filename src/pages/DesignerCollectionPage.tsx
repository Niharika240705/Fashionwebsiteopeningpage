import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Globe } from 'lucide-react';
import { BudgetFilter } from '../components/products/BudgetFilter';
import { DesignerProductFilters, DesignerFilterState } from '../components/products/DesignerProductFilters';
import { ProductGrid } from '../components/products/ProductGrid';
import { VirtualTryOnModal } from '../components/VirtualTryOnModal';
import { getDesigner, getDesignerProducts } from '../utils/api';
import { Designer } from '../types/designer';
import { ProductFacets, ProductSummary } from '../types/product';
import { trackEvent } from '../utils/analytics';
import { useBudgetPreference } from '../contexts/BudgetPreferenceContext';

interface DesignerCollectionPageProps {
  onRequireAuth?: () => void;
}

export function DesignerCollectionPage({ onRequireAuth }: DesignerCollectionPageProps) {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [facets, setFacets] = useState<ProductFacets>();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [designerLoading, setDesignerLoading] = useState(true);
  const [tryOnProduct, setTryOnProduct] = useState<ProductSummary | null>(null);
  const { priceRange } = useBudgetPreference();
  const didSyncBudget = useRef(false);

  const filters: DesignerFilterState = useMemo(
    () => ({
      category: searchParams.get('category') || undefined,
      occasion: searchParams.get('occasion') || undefined,
      gender: searchParams.get('gender') || undefined,
      color: searchParams.get('color') || undefined,
      availability: (searchParams.get('availability') as 'in_stock') || undefined,
      sort: searchParams.get('sort') || 'newest',
    }),
    [searchParams]
  );

  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setDesignerLoading(true);
    getDesigner(slug)
      .then((data) => {
        if (cancelled) return;
        setDesigner(data.designer);
        setNotFound(false);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setDesignerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || notFound) return;
    let cancelled = false;
    setLoading(true);
    trackEvent('designer_collection_viewed', { slug, ...filters });
    getDesignerProducts(slug, {
      category: filters.category,
      occasion: filters.occasion,
      gender: filters.gender,
      color: filters.color,
      availability: filters.availability,
      sort: filters.sort as any,
      minPrice,
      maxPrice,
      page,
      limit: 24,
    })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products || []);
        setFacets(data.facets);
        setTotal(data.total || 0);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, filters.category, filters.occasion, filters.gender, filters.color, filters.availability, filters.sort, minPrice, maxPrice, page, notFound]);

  useEffect(() => {
    if (didSyncBudget.current) return;
    didSyncBudget.current = true;
    const hasUrlPrice = searchParams.has('minPrice') || searchParams.has('maxPrice');
    if (!hasUrlPrice && (priceRange.minPrice !== undefined || priceRange.maxPrice !== undefined)) {
      updateParams({ minPrice: priceRange.minPrice, maxPrice: priceRange.maxPrice });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateParams = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    if (!('page' in next)) params.set('page', '1');
    setSearchParams(params);
  };

  if (notFound) {
    return <Navigate to="/designers" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Cover hero */}
      <section className="relative h-[46vh] sm:h-[54vh] min-h-[340px] bg-black overflow-hidden">
        {designerLoading ? (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
        ) : (
          <img
            src={designer?.coverImageUrl}
            alt={designer?.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

        <div className="absolute top-24 sm:top-28 left-4 sm:left-8">
          <Link
            to="/designers"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs tracking-[0.2em] uppercase transition-colors"
          >
            <ArrowLeft size={14} />
            All Designers
          </Link>
        </div>

        <div className="absolute inset-x-0 bottom-0 max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pb-8 sm:pb-12 text-white">
          {designer?.metadata?.city && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-white/60 mb-3"
            >
              {designer.metadata.city}
              {designer.metadata.foundedYear ? ` \u2014 Est. ${designer.metadata.foundedYear}` : ''}
            </motion.p>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-6xl mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {designer?.name || '\u00A0'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-2xl text-sm sm:text-base text-white/80 leading-relaxed mb-5"
          >
            {designer?.shortDescription}
          </motion.p>
          <div className="flex flex-wrap items-center gap-3">
            {designer?.specializations?.map((spec) => (
              <span
                key={spec}
                className="text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 border border-white/25 text-white/85"
              >
                {spec}
              </span>
            ))}
            {designer?.websiteUrl && (
              <a
                href={designer.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('designer_website_clicked', { slug: designer.slug })}
                className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase ml-1 border-b border-white/40 hover:border-white pb-0.5 transition-colors"
              >
                <Globe size={12} />
                Official Website
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14">
        <div className="mb-8 pb-6 border-b border-black/10">
          <BudgetFilter onChange={({ minPrice: mp, maxPrice: xp }) => updateParams({ minPrice: mp, maxPrice: xp })} />
        </div>

        <div className="flex items-baseline justify-between mb-6">
          <p className="text-sm text-black/50">
            {loading ? 'Loading pieces…' : `${total} piece${total === 1 ? '' : 's'} from ${designer?.name || 'this designer'}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <DesignerProductFilters filters={filters} facets={facets} onChange={updateParams} />
          <ProductGrid
            products={products}
            loading={loading}
            emptyMessage="No pieces match these filters yet — try clearing a filter."
            onTryOn={setTryOnProduct}
            onRequireAuth={onRequireAuth}
            buyLabel="View Original"
            showCollection
          />
        </div>
      </div>

      <VirtualTryOnModal
        isOpen={!!tryOnProduct}
        product={tryOnProduct}
        onClose={() => setTryOnProduct(null)}
      />
    </div>
  );
}
