import { PersonaLogo } from '../components/PersonaLogo';
import { MonthlyTrends } from '../components/MonthlyTrends';
import { InfluencerSuggests } from '../components/InfluencerSuggests';
import { FashionChronicle } from '../components/FashionChronicle';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <>
      <PersonaLogo />
      <MonthlyTrends />
      <InfluencerSuggests />
      <FashionChronicle />
      <Footer />
    </>
  );
}
