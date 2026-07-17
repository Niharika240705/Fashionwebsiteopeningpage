import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { SideMenu } from './components/SideMenu';
import { SavedPanel } from './components/SavedPanel';
import { ImageSearchModal } from './components/ImageSearchModal';
import { UfindModal } from './components/Ufind/UfindModal';
import { UfindQuestionnaire } from './components/Ufind/UfindQuestionnaire';
import { UfindResult } from './components/Ufind/UfindResult';
import { UfindFeed } from './components/Ufind/UfindFeed';
import { LoginModal } from './components/LoginModal';
import { useAuth } from './contexts/AuthContext';
import { SavedItemsProvider, useSavedItems } from './contexts/SavedItemsContext';
import { testBackendConnection } from './utils/api';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { ProductPage } from './pages/ProductPage';
import { SavedPage } from './pages/SavedPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { getRedirectUrl } from './utils/api';

type UfindView = 'closed' | 'modal' | 'questionnaire' | 'result' | 'feed';

function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [ufindView, setUfindView] = useState<UfindView>('closed');
  const [selectedBodyShape, setSelectedBodyShape] = useState('');
  const { refreshSession } = useAuth();
  const { savedProducts, toggleSave } = useSavedItems();
  const navigate = useNavigate();

  useEffect(() => {
    testBackendConnection().then((connected) => {
      if (connected) console.log('✅ Backend connected successfully');
      else console.warn('⚠️ Backend connection failed. Make sure the server is running on port 5001');
    });
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    if (auth === 'success') {
      refreshSession().finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else if (auth === 'error') {
      console.error('OAuth error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshSession]);

  return (
    <div className="min-h-screen bg-white">
      <Header
        onMenuClick={() => setIsMenuOpen(true)}
        onUfindClick={() => setUfindView('modal')}
        onSavedClick={() => {
          setIsSavedOpen(true);
          navigate('/saved');
        }}
        onImageSearchClick={() => setIsImageSearchOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        onSearchSubmit={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
      />
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={(path) => {
          setIsMenuOpen(false);
          navigate(path);
        }}
      />
      <SavedPanel
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedItems={savedProducts.map((p) => ({
          id: p.id as unknown as number,
          image: p.images?.[0] || '',
          title: p.name,
          designer: p.brand,
          priceRange: 'Mid' as const,
          offerId: p.offerId,
        }))}
        onRemove={(id) => {
          const product = savedProducts.find((p) => String(p.id) === String(id));
          if (product) toggleSave(product);
        }}
        onOpenItem={(item: any) => {
          if (item.offerId) {
            window.open(getRedirectUrl(item.offerId, 'saved_panel'), '_blank', 'noopener,noreferrer');
          }
        }}
      />
      <ImageSearchModal isOpen={isImageSearchOpen} onClose={() => setIsImageSearchOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <UfindModal
        isOpen={ufindView === 'modal'}
        onClose={() => setUfindView('closed')}
        onShapeSelect={(shape) => {
          setSelectedBodyShape(shape);
          setUfindView('result');
        }}
        onStartQuestionnaire={() => setUfindView('questionnaire')}
      />
      <UfindQuestionnaire
        isOpen={ufindView === 'questionnaire'}
        onClose={() => setUfindView('closed')}
        onComplete={(bodyShape) => {
          setSelectedBodyShape(bodyShape);
          setUfindView('result');
        }}
      />
      <UfindResult
        isOpen={ufindView === 'result'}
        bodyShape={selectedBodyShape}
        onViewFeed={() => setUfindView('feed')}
      />
      <UfindFeed
        isOpen={ufindView === 'feed'}
        bodyShape={selectedBodyShape}
        onClose={() => {
          setUfindView('closed');
          setSelectedBodyShape('');
        }}
      />

      {ufindView !== 'feed' && (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/women/:category" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/men/*" element={<ComingSoon audience="Men" />} />
          <Route path="/kids/*" element={<ComingSoon audience="Kids" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}

function ComingSoon({ audience }: { audience: string }) {
  return (
    <div className="max-w-[1600px] mx-auto px-8 py-24 text-center">
      <h1 className="text-3xl mb-3">{audience}</h1>
      <p className="text-black/50">Coming soon after the women’s catalog MVP is stable.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SavedItemsProvider>
        <AppShell />
      </SavedItemsProvider>
    </BrowserRouter>
  );
}
