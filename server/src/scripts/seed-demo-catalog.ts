import 'dotenv/config';
import { IngestionOrchestratorService } from '../services/ingestion/ingestion-orchestrator.service';
import { connectMongoDB, disconnectMongoDB } from '../config/database';

async function main() {
  await connectMongoDB();
  const orchestrator = new IngestionOrchestratorService();
  await orchestrator.ensureSeedSources();
  const run = await orchestrator.ingestSource('demo-affiliate', {
    limit: 100,
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
