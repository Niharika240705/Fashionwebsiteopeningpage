import { SourceAdapter } from './types';
import { DemoAffiliateAdapter } from './demo-affiliate/affiliate.adapter';
import { MyntraScraperAdapter } from './myntra/scraper.adapter';
import { HMScraperAdapter } from './hm/scraper.adapter';
import { ZaraScraperAdapter } from './zara/scraper.adapter';

const adapters: Record<string, SourceAdapter> = {
  'demo-affiliate': new DemoAffiliateAdapter(),
  myntra: new MyntraScraperAdapter(),
  hm: new HMScraperAdapter(),
  zara: new ZaraScraperAdapter(),
};

export function getSourceAdapter(sourceId: string): SourceAdapter | undefined {
  return adapters[sourceId];
}

export function listSourceAdapters(): SourceAdapter[] {
  return Object.values(adapters);
}

export function registerSourceAdapter(adapter: SourceAdapter): void {
  adapters[adapter.sourceId] = adapter;
}
