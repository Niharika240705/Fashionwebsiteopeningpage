import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ProductSummary } from '../types/product';
import { getSavedProducts, removeSavedProduct, saveProduct } from '../utils/api';
import { useAuth } from './AuthContext';
import { trackEvent } from '../utils/analytics';

interface SavedItemsContextType {
  savedIds: string[];
  savedProducts: ProductSummary[];
  isSaved: (productId: string) => boolean;
  toggleSave: (product: ProductSummary) => Promise<void>;
  refreshSaved: () => Promise<void>;
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);
const GUEST_KEY = 'fashioninsta_saved_products';

function readGuestSaved(): ProductSummary[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeGuestSaved(products: ProductSummary[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(products));
}

export function SavedItemsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [savedProducts, setSavedProducts] = useState<ProductSummary[]>([]);

  const refreshSaved = async () => {
    if (isAuthenticated) {
      try {
        const data = await getSavedProducts();
        setSavedProducts(data.products || []);
        return;
      } catch (error) {
        console.error('Failed to load saved products', error);
      }
    }
    setSavedProducts(readGuestSaved());
  };

  useEffect(() => {
    refreshSaved();
  }, [isAuthenticated]);

  const savedIds = savedProducts.map((p) => p.id);
  const isSaved = (productId: string) => savedIds.includes(productId);

  const toggleSave = async (product: ProductSummary) => {
    if (isSaved(product.id)) {
      if (isAuthenticated) {
        await removeSavedProduct(product.id);
      } else {
        writeGuestSaved(readGuestSaved().filter((p) => p.id !== product.id));
      }
      setSavedProducts((prev) => prev.filter((p) => p.id !== product.id));
      trackEvent('product_unsaved', { productId: product.id });
    } else {
      if (isAuthenticated) {
        await saveProduct(product.id);
      } else {
        writeGuestSaved([...readGuestSaved(), product]);
      }
      setSavedProducts((prev) => [...prev, product]);
      trackEvent('product_saved', { productId: product.id, brand: product.brand });
    }
  };

  return (
    <SavedItemsContext.Provider
      value={{ savedIds, savedProducts, isSaved, toggleSave, refreshSaved }}
    >
      {children}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error('useSavedItems must be used within SavedItemsProvider');
  }
  return context;
}
