import { HeroSection } from '../components/HeroSection';
import { PersonaLogo } from '../components/PersonaLogo';
import { MonthlyTrends } from '../components/MonthlyTrends';
import { InfluencerSuggests } from '../components/InfluencerSuggests';
import { FashionChronicle } from '../components/FashionChronicle';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <>
      <PersonaLogo />
      <HeroSection />
      <MonthlyTrends />
      <InfluencerSuggests />
      <FashionChronicle />
      <Footer />
    </>
  );
}
