import 'dotenv/config';
import mongoose from 'mongoose';
import { IngestionOrchestratorService } from '../services/ingestion/ingestion-orchestrator.service';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-website';
  await mongoose.connect(uri);
  const orchestrator = new IngestionOrchestratorService();
  await orchestrator.ensureSeedSources();
  const run = await orchestrator.ingestSource('demo-affiliate', {
    limit: 20,
    processImages: false,
  });
  console.log('Demo ingest complete:', {
    status: run.status,
    counts: run.counts,
  });
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
