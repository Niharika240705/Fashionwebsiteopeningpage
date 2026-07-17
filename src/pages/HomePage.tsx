import { HeroSection } from '../components/HeroSection';
import { PersonaLogo } from '../components/PersonaLogo';
import { MonthlyTrends } from '../components/MonthlyTrends';
import { InfluencerSuggests } from '../components/InfluencerSuggests';
import { FashionChronicle } from '../components/FashionChronicle';
import { Footer } from '../components/Footer';
import { TrendingProducts } from '../components/TrendingProducts';

export function HomePage() {
  return (
    <>
      <PersonaLogo />
      <HeroSection />
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">
        <TrendingProducts limit={8} />
      </section>
      <MonthlyTrends />
      <InfluencerSuggests />
      <FashionChronicle />
      <Footer />
    </>
  );
}
