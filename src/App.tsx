import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PersonaLogo } from './components/PersonaLogo';
import { SideMenu } from './components/SideMenu';
import { MonthlyTrends } from './components/MonthlyTrends';
import { InfluencerSuggests } from './components/InfluencerSuggests';
import { FashionChronicle } from './components/FashionChronicle';
import { SavedPanel } from './components/SavedPanel';
import { ImageSearchModal } from './components/ImageSearchModal';
import { UfindModal } from './components/Ufind/UfindModal';
import { UfindQuestionnaire } from './components/Ufind/UfindQuestionnaire';
import { UfindResult } from './components/Ufind/UfindResult';
import { UfindFeed } from './components/Ufind/UfindFeed';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { TrendingProducts } from './components/TrendingProducts';
import { trackOutfitSave } from './utils/analytics';
import { useAuth } from './contexts/AuthContext';
import { testBackendConnection } from './utils/api';

type UfindView = 'closed' | 'modal' | 'questionnaire' | 'result' | 'feed';

interface SavedItem {
  id: number;
  image: string;
  title: string;
  designer: string;
  priceRange: 'Luxury' | 'Mid' | 'Affordable';
}

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [ufindView, setUfindView] = useState<UfindView>('closed');
  const [selectedBodyShape, setSelectedBodyShape] = useState<string>('');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const { setAuthTokens } = useAuth();

  // Test backend connection on mount
  useEffect(() => {
    testBackendConnection().then((connected) => {
      if (connected) {
        console.log('✅ Backend connected successfully');
      } else {
        console.warn('⚠️ Backend connection failed. Make sure the server is running on port 5001');
      }
    });
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    const error = urlParams.get('error');

    if (accessToken && refreshToken) {
      setAuthTokens(accessToken, refreshToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      console.error('OAuth error:', error);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setAuthTokens]);

  const handleUfindClick = () => {
    setUfindView('modal');
  };

  const handleShapeSelect = (shape: string) => {
    setSelectedBodyShape(shape);
    setUfindView('result');
  };

  const handleStartQuestionnaire = () => {
    setUfindView('questionnaire');
  };

  const handleQuestionnaireComplete = (bodyShape: string) => {
    setSelectedBodyShape(bodyShape);
    setUfindView('result');
  };

  const handleViewFeed = () => {
    setUfindView('feed');
  };

  const handleCloseFeed = () => {
    setUfindView('closed');
    setSelectedBodyShape('');
  };

  const handleSaveOutfit = (outfit: any) => {
    const newItem: SavedItem = {
      id: outfit.id,
      image: outfit.image,
      title: outfit.description,
      designer: outfit.designer,
      priceRange: outfit.tag === 'Mid-Luxury' ? 'Mid' : outfit.tag as 'Luxury' | 'Affordable',
    };
    setSavedItems(prev => {
      // Check if already saved
      if (prev.some(item => item.id === newItem.id)) {
        return prev;
      }
      // Track outfit save
      trackOutfitSave(outfit.id, outfit.designer);
      return [...prev, newItem];
    });
  };

  const handleRemoveSaved = (id: number) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onMenuClick={() => setIsMenuOpen(true)} 
        onUfindClick={handleUfindClick}
        onSavedClick={() => setIsSavedOpen(true)}
        onImageSearchClick={() => setIsImageSearchOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
      />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <SavedPanel 
        isOpen={isSavedOpen} 
        onClose={() => setIsSavedOpen(false)}
        savedItems={savedItems}
        onRemove={handleRemoveSaved}
      />
      <ImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
      />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
      
      {/* Ufind Components */}
      <UfindModal
        isOpen={ufindView === 'modal'}
        onClose={() => setUfindView('closed')}
        onShapeSelect={handleShapeSelect}
        onStartQuestionnaire={handleStartQuestionnaire}
      />
      <UfindQuestionnaire
        isOpen={ufindView === 'questionnaire'}
        onClose={() => setUfindView('closed')}
        onComplete={handleQuestionnaireComplete}
      />
      <UfindResult
        isOpen={ufindView === 'result'}
        bodyShape={selectedBodyShape}
        onViewFeed={handleViewFeed}
      />
      <UfindFeed
        isOpen={ufindView === 'feed'}
        bodyShape={selectedBodyShape}
        onClose={handleCloseFeed}
      />

      {/* Main Content - Hidden when feed is open */}
      {ufindView !== 'feed' && (
        <>
          <PersonaLogo />
          <HeroSection />
          <MonthlyTrends />
          <TrendingProducts />
          <InfluencerSuggests />
          <FashionChronicle />
          <Footer />
        </>
      )}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}