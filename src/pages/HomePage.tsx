import { PersonaLogo } from '../components/PersonaLogo';
import { BudgetFilter } from '../components/products/BudgetFilter';
import { MonthlyTrends } from '../components/MonthlyTrends';
import { InfluencerSuggests } from '../components/InfluencerSuggests';
import { FashionChronicle } from '../components/FashionChronicle';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <>
      <PersonaLogo />
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-black/10 px-4 sm:px-6 md:px-8 py-3">
        <div className="max-w-[1600px] mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mb-2 sm:hidden">
            Set your budget
          </p>
          <BudgetFilter compact />
        </div>
      </div>
      <MonthlyTrends />
      <InfluencerSuggests />
      <FashionChronicle />
      <Footer />
    </>
  );
}
