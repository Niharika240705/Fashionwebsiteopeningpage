import * as cron from 'node-cron';
import { ScrapingOrchestratorService } from '../services/scraping-orchestrator.service';

const scrapingOrchestrator = new ScrapingOrchestratorService();

/**
 * Scheduled scraping jobs
 * Runs daily to scrape trending products from various sources
 */
export function setupScrapingJobs() {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🕐 Starting scheduled scraping job...');
    
    try {
      // Configure scraping sources
      // NOTE: Update these URLs with actual listing pages
      const scrapingConfigs = [
        {
          type: 'myntra' as const,
          url: process.env.MYNTRA_LISTING_URL || 'https://www.myntra.com/men-tshirts',
        },
        {
          type: 'hm' as const,
          url: process.env.HM_LISTING_URL || 'https://www2.hm.com/en_in/men/shop-by-product/t-shirts.html',
        },
        // Add more sources as needed
      ];

      await scrapingOrchestrator.batchScrape(scrapingConfigs);
      console.log('✅ Scheduled scraping job completed');
    } catch (error) {
      console.error('❌ Scheduled scraping job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // Adjust to your timezone
  });

  // Update trend scores every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🕐 Updating trend scores...');
    
    try {
      const { TrendDetectionService } = await import('../services/trend-detection.service');
      const trendService = new TrendDetectionService();
      await trendService.updateAllTrendScores();
      console.log('✅ Trend scores updated');
    } catch (error) {
      console.error('❌ Trend score update failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log('✅ Scraping jobs scheduled');
}

