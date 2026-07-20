import 'dotenv/config';
import { Source } from '../models/Source.model';
import { connectMongoDB, disconnectMongoDB } from '../config/database';
import { upsertProductAndOffer } from '../services/ingestion/offer-upsert.service';
import {
  mapPythonProductToNormalized,
  pythonCatalogService,
  retailerDisplayName,
} from '../services/python-catalog.service';
import { getAllAudiences, getCategoriesForAudience, isMvpCategory } from '../services/ingestion/taxonomy.service';

async function ensureRetailerSource(retailerId: string): Promise<void> {
  const id = retailerId.toLowerCase();
  const displayName = retailerDisplayName(id);
  const audiences = getAllAudiences();
  const categories = Array.from(
    new Set(audiences.flatMap((audience) => getCategoriesForAudience(audience)))
  );

  await Source.findOneAndUpdate(
    { sourceId: id },
    {
      $set: {
        sourceId: id,
        name: displayName,
        domain: `${id}.com`,
        mode: 'affiliate_feed',
        enabled: true,
        audiences,
        categories,
        attributionText: `Sold on ${displayName}`,
        disclosureText: 'We may earn a commission when you buy through links on our site.',
        allowsImageTransform: false,
        allowsScraping: false,
        allowedDestinationHosts: [],
        policyVersion: '1.0',
        lastSyncedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function main() {
  const baseUrl = process.env.PYTHON_INGESTION_API_URL || 'http://localhost:8000';
  console.log(`Pulling products from ${baseUrl} ...`);

  await connectMongoDB();

  const products = await pythonCatalogService.fetchAllProducts();
  console.log(`Fetched ${products.length} products from Python API`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of products) {
    const retailerId = item.retailer_id.toLowerCase();
    const normalized = mapPythonProductToNormalized(item);

    if (!isMvpCategory(normalized.audience, normalized.category)) {
      skipped += 1;
      continue;
    }

    await ensureRetailerSource(retailerId);
    const sellerName = retailerDisplayName(retailerId);
    const result = await upsertProductAndOffer(normalized, retailerId, sellerName);

    if (result.created) created += 1;
    else if (result.updated) updated += 1;
  }

  console.log('Sync complete:', { created, updated, skipped, total: products.length });
  await disconnectMongoDB();
}

main().catch(async (error) => {
  console.error('Sync failed:', error);
  await disconnectMongoDB();
  process.exit(1);
});
