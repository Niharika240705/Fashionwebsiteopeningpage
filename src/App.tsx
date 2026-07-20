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
import { PersonaAI } from './components/assistant/PersonaAI';
import { useAuth } from './contexts/AuthContext';
import { SavedItemsProvider, useSavedItems } from './contexts/SavedItemsContext';
import { BudgetPreferenceProvider } from './contexts/BudgetPreferenceContext';
import { testBackendConnection, getRedirectUrl } from './utils/api';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { ProductPage } from './pages/ProductPage';
import { SavedPage } from './pages/SavedPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { Audience } from './utils/taxonomy';

type UfindView = 'closed' | 'modal' | 'questionnaire' | 'result' | 'feed';

function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [ufindView, setUfindView] = useState<UfindView>('closed');
  const [selectedBodyShape, setSelectedBodyShape] = useState('');
  const [ufindAudience, setUfindAudience] = useState<Audience>('women');
  const { refreshSession, isAuthenticated } = useAuth();
  const { savedProducts, toggleSave } = useSavedItems();
  const navigate = useNavigate();

  const openLogin = () => setIsLoginOpen(true);

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
    if (urlParams.get('login') === '1') {
      setIsLoginOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshSession]);

  const handleUfindClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setUfindView('modal');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header
        onMenuClick={() => setIsMenuOpen(true)}
        onUfindClick={handleUfindClick}
        onSavedClick={() => {
          setIsSavedOpen(true);
          navigate('/saved');
        }}
        onImageSearchClick={() => setIsImageSearchOpen(true)}
        onLoginClick={openLogin}
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
        isAuthenticated={isAuthenticated}
        onRequireAuth={openLogin}
        onShapeSelect={(shape, audience) => {
          setSelectedBodyShape(shape);
          setUfindAudience(audience);
          setUfindView('result');
        }}
        onStartQuestionnaire={(audience) => {
          setUfindAudience(audience);
          setUfindView('questionnaire');
        }}
      />
      <UfindQuestionnaire
        isOpen={ufindView === 'questionnaire'}
        audience={ufindAudience}
        onClose={() => setUfindView('closed')}
        onComplete={(bodyShape, audience) => {
          setSelectedBodyShape(bodyShape);
          setUfindAudience(audience);
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
        audience={ufindAudience}
        onRequireAuth={openLogin}
        onClose={() => {
          setUfindView('closed');
          setSelectedBodyShape('');
        }}
      />

      {ufindView !== 'feed' && (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:audience/:category" element={<CategoryPage onRequireAuth={openLogin} />} />
          <Route path="/search" element={<SearchPage onRequireAuth={openLogin} />} />
          <Route path="/products/:id" element={<ProductPage onRequireAuth={openLogin} />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      {/* Persona AI floating assistant — persists across every route */}
      <PersonaAI />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BudgetPreferenceProvider>
        <SavedItemsProvider>
          <AppShell />
        </SavedItemsProvider>
      </BudgetPreferenceProvider>
    </BrowserRouter>
  );
}
