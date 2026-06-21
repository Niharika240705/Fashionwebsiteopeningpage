import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, TrendingUp, DollarSign, Search } from 'lucide-react';
import { ProductModal } from './ProductModal';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  images: string[];
  productUrl: string;
  sourceWebsite: string;
  trendScore: number;
  disclaimer: string;
}

interface TrendingProductsProps {
  category?: string;
  limit?: number;
}

export function TrendingProducts({ category, limit = 20 }: TrendingProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchTrendingProducts();
  }, [category, limit]);

  const fetchTrendingProducts = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = category
        ? `${apiUrl}/products/trending?category=${encodeURIComponent(category)}&limit=${limit}`
        : `${apiUrl}/products/trending?limit=${limit}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    // Open product modal instead of navigating away
    setSelectedProduct(product);
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-xl h-96"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTrendingProducts}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">No trending products found.</p>
      </div>
    );
  }

  return (
    <div className="py-12 relative z-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-6 h-6 text-black" />
          <h2 className="text-3xl font-bold text-black">
            {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Trends` : 'Trending Now'}
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Latest scraped fashion items from our AI engine.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
            onClick={() => handleProductClick(product)}
          >
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback to placeholder
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Product+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}

              {/* Trend Badge */}
              {product.trendScore > 50 && (
                <div className="absolute top-3 left-3 bg-black/80 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Trending</span>
                </div>
              )}

              {/* Discount Badge */}
              {product.discountPercentage && product.discountPercentage > 0 && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  -{product.discountPercentage}%
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                <div className="bg-white text-black rounded-full p-3 shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all">
                  <Search className="w-4 h-4" />
                  <span className="text-sm font-semibold tracking-wide">View Details</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">
                    {product.brand}
                  </p>
                  <h3 className="text-sm font-semibold text-black line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-black">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Category & Source */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 capitalize">
                  {product.category}
                </span>
                <span className="text-xs text-gray-400 capitalize">
                  {product.sourceWebsite.replace('https://www.', '').split('/')[0]}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

