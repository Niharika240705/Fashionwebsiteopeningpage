import * as cron from 'node-cron';
import { IngestionOrchestratorService } from '../services/ingestion/ingestion-orchestrator.service';
import { Offer } from '../models/Offer.model';
import { Source } from '../models/Source.model';

const ingestionOrchestrator = new IngestionOrchestratorService();

/**
 * Catalog sync and maintenance jobs for the affiliate marketplace MVP.
 */
export function setupScrapingJobs() {
  // Sync enabled sources every 8 hours
  cron.schedule('0 */8 * * *', async () => {
    console.log('🕐 Starting scheduled catalog sync...');
    try {
      await ingestionOrchestrator.ensureSeedSources();
      const sources = await Source.find({ enabled: true });
      for (const source of sources) {
        await ingestionOrchestrator.ingestSource(source.sourceId, {
          limit: 100,
          processImages: false,
        });
      }
      console.log('✅ Scheduled catalog sync completed');
    } catch (error) {
      console.error('❌ Scheduled catalog sync failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  // Mark stale offers daily
  cron.schedule('30 3 * * *', async () => {
    console.log('🕐 Checking stale offers...');
    try {
      const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const result = await Offer.updateMany(
        { status: 'active', lastSeenAt: { $lt: cutoff } },
        { $set: { status: 'stale' } }
      );
      console.log(`✅ Marked ${result.modifiedCount} offers stale`);
    } catch (error) {
      console.error('❌ Stale offer job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
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

  console.log('✅ Catalog sync jobs scheduled');
}
