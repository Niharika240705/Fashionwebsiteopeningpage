import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://localhost:27017/fashion-website';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

mongoose.set('strictQuery', true);

function describeMongoError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED')) {
      return 'MongoDB is not reachable. Start local MongoDB (e.g. brew services start mongodb-community) or set MONGODB_URI to Atlas.';
    }
    if (error.message.includes('authentication failed')) {
      return 'MongoDB authentication failed. Check username/password in MONGODB_URI.';
    }
    return error.message;
  }
  return String(error);
}

function attachConnectionHandlers(): void {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected — driver will auto-reconnect');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', describeMongoError(error));
  });
}

export async function connectMongoDB(uri = process.env.MONGODB_URI || DEFAULT_URI): Promise<typeof mongoose> {
  attachConnectionHandlers();

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      return mongoose;
    } catch (error) {
      lastError = error;
      console.error(
        `❌ MongoDB connect attempt ${attempt}/${MAX_RETRIES} failed: ${describeMongoError(error)}`
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw new Error(`Could not connect to MongoDB after ${MAX_RETRIES} attempts: ${describeMongoError(lastError)}`);
}

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectMongoDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
