import 'dotenv/config';
import { IngestionOrchestratorService } from '../services/ingestion/ingestion-orchestrator.service';
import { connectMongoDB, disconnectMongoDB } from '../config/database';
import { Product } from '../models/Product.model';
import { Offer } from '../models/Offer.model';
import { ImageAsset } from '../models/ImageAsset.model';

const SOURCE_ID = 'demo-affiliate';

async function main() {
  await connectMongoDB();

  // Clear any previously-seeded demo-affiliate data first. The demo feed is
  // regenerated on every run (categories/urls/ids can change), and the
  // dedupe logic in offer-upsert.service matches by canonicalUrl/fingerprint
  // across ALL products, so stale rows from older feed versions (different
  // slugs, generic shared URLs, etc.) would otherwise linger and pollute
  // category pages instead of being replaced.
  const staleProducts = await Product.find({ retailerId: SOURCE_ID }, { _id: 1 }).lean();
  const staleIds = staleProducts.map((p) => p._id);
  if (staleIds.length) {
    await Offer.deleteMany({ productId: { $in: staleIds } });
    await ImageAsset.deleteMany({ productId: { $in: staleIds } });
    await Product.deleteMany({ _id: { $in: staleIds } });
    console.log(`Removed ${staleIds.length} stale demo-affiliate products before reseeding.`);
  }

  const orchestrator = new IngestionOrchestratorService();
  await orchestrator.ensureSeedSources();
  const run = await orchestrator.ingestSource(SOURCE_ID, {
    limit: 1000,
    processImages: false,
  });
  console.log('Demo ingest complete:', {
    status: run.status,
    counts: run.counts,
  });
  await disconnectMongoDB();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectMongoDB();
  process.exit(1);
});
