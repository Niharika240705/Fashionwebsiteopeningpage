import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { ScrapingOrchestratorService } from '../services/scraping-orchestrator.service';
import path from 'path';

// Load environment variables from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-website';

async function runComprehensiveScrape() {
  console.log('🔄 Starting Comprehensive Myntra Scrape...');
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orchestrator = new ScrapingOrchestratorService();
    
    // We limit to 10 products per category for initial scrape to save time
    const MAX_PRODUCTS_PER_CATEGORY = 10;

    const scrapingConfigs: Array<{ type: 'myntra' | 'hm' | 'zara', url: string, maxProducts?: number }> = [
      // --- MEN ---
      { type: 'myntra', url: 'https://www.myntra.com/men-tshirts', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/men-casual-shirts', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/men-jeans', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/men-casual-shoes', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/backpacks', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/watches', maxProducts: MAX_PRODUCTS_PER_CATEGORY },

      // --- WOMEN ---
      { type: 'myntra', url: 'https://www.myntra.com/dresses', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/women-tops', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/women-jeans', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/flats', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/handbags', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/jewellery', maxProducts: MAX_PRODUCTS_PER_CATEGORY },

      // --- KIDS ---
      { type: 'myntra', url: 'https://www.myntra.com/boys-tshirts', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/girls-dresses', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
      { type: 'myntra', url: 'https://www.myntra.com/kids-shoes', maxProducts: MAX_PRODUCTS_PER_CATEGORY },
    ];

    console.log(`📋 Loaded ${scrapingConfigs.length} categories to scrape. Limit: ${MAX_PRODUCTS_PER_CATEGORY} products each.`);
    
    await orchestrator.batchScrape(scrapingConfigs);
    
    console.log('✅ Comprehensive Myntra Scrape Completed Successfully!');
  } catch (error) {
    console.error('❌ Error during comprehensive scrape:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    process.exit(0);
  }
}

runComprehensiveScrape();
