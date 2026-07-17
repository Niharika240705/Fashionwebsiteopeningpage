import { ProductGrid } from '../components/products/ProductGrid';
import { useSavedItems } from '../contexts/SavedItemsContext';

export function SavedPage() {
  const { savedProducts } = useSavedItems();

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14">
      <h1 className="text-3xl md:text-4xl mb-2">Saved</h1>
      <p className="text-sm text-black/50 mb-8">
        Styles you’ve bookmarked. Guest saves stay on this device until you sign in.
      </p>
      <ProductGrid
        products={savedProducts}
        emptyMessage="No saved products yet. Browse women’s categories to start collecting looks."
      />
    </div>
  );
}
