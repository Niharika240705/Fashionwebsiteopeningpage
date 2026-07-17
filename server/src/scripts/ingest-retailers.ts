import * as dotenv from 'dotenv';
import path from 'path';
import { IngestionOrchestratorService } from '../services/ingestion/ingestion-orchestrator.service';
import { Product } from '../models/Product.model';
import { Offer } from '../models/Offer.model';
import { connectMongoDB, disconnectMongoDB } from '../config/database';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  const args = process.argv.slice(2);
  const clearDemo = args.includes('--clear-demo');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 100;
  const sourcesArg = args.find((a) => a.startsWith('--sources='));
  const sources = sourcesArg
    ? sourcesArg
        .split('=')[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  console.log('🔌 Connecting to MongoDB...');
  await connectMongoDB();
  console.log('✅ Connected');

  if (clearDemo) {
    const offers = await Offer.find({ sourceId: 'demo-affiliate' }).select('productId');
    const productIds = offers.map((o) => o.productId);
    await Offer.deleteMany({ sourceId: 'demo-affiliate' });
    const deleted = await Product.deleteMany({
      $or: [{ retailerId: 'demo-affiliate' }, { _id: { $in: productIds } }],
    });
    console.log(`🧹 Cleared demo catalog (${deleted.deletedCount || 0} products)`);
  }

  const orchestrator = new IngestionOrchestratorService();
  await orchestrator.ensureSeedSources();

  const runs = await orchestrator.ingestEnabledRetailers({
    limit,
    processImages: false,
    sources,
  });

  if (!runs.length) {
    console.warn(
      '⚠️ No sources ingested. Scrapers are disabled by default — run npm run ingest:demo or set CRON_INGEST_SOURCE=demo-affiliate.'
    );
  } else {
    console.log(
      '✅ Catalog ingest complete:',
      runs.map((r) => ({ sourceId: r.sourceId, status: r.status, counts: r.counts }))
    );
  }

  await disconnectMongoDB();
  process.exit(0);
}

main().catch(async (error) => {
  console.error('❌ Catalog ingest failed:', error);
  await disconnectMongoDB().catch(() => undefined);
  process.exit(1);
});
