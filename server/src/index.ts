import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import redirectRoutes from './routes/redirect.routes';
import adminIngestionRoutes from './routes/admin-ingestion.routes';
import monitoringRoutes from './routes/monitoring.routes';
import tryOnRoutes from './routes/try-on.routes';
import assistantRoutes from './routes/assistant.routes';
import './config/passport.config';
import { IngestionOrchestratorService } from './services/ingestion/ingestion-orchestrator.service';
import { connectMongoDB, isMongoReady } from './config/database';

const DEFAULT_SECRETS = new Set([
  'your-secret-key-change-in-production',
  'your-refresh-secret-key',
  'your-super-secret-jwt-key-min-32-characters',
  'your-super-secret-refresh-key-min-32-characters',
  'your-super-secret-session-key-min-32-characters',
]);

function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'SESSION_SECRET',
    'FRONTEND_URL',
  ] as const;

  for (const key of required) {
    const value = process.env[key];
    const secretTooShort = key.includes('SECRET') && (!value || value.length < 32);
    if (!value || DEFAULT_SECRETS.has(value) || secretTooShort) {
      console.error(`❌ Refusing to start: ${key} is missing or insecure for production`);
      process.exit(1);
    }
  }
}

assertProductionConfig();

const app = express();
const PORT = process.env.PORT || 5001;

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
]
  .map((origin) => origin?.trim())
  .filter(Boolean) as string[];

if (!allowedOrigins.length) {
  allowedOrigins.push('http://localhost:3000');
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth requests from this IP, please try again later.' },
});

const redirectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many redirect requests from this IP, please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/r', redirectLimiter);

// Try-on requests carry a base64 full-body photo, so this route gets a larger JSON body limit
// than the rest of the API. Mounted before the global parser so it only applies to this path
// (body-parser skips re-parsing a request whose body is already parsed).
app.use('/api/try-on', express.json({ limit: '15mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (_req, res) => {
  const mongoReady = isMongoReady();
  res.status(mongoReady ? 200 : 503).json({
    status: mongoReady ? 'ok' : 'degraded',
    mongo: mongoReady,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/r', redirectRoutes);
app.use('/api/try-on', tryOnRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/admin/ingestion', adminIngestionRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: isProd ? 'Internal server error' : err.message || 'Internal server error',
    ...(!isProd && { stack: err.stack }),
  });
});

async function start() {
  try {
    await connectMongoDB();

    try {
      const orchestrator = new IngestionOrchestratorService();
      await orchestrator.ensureSeedSources();
      if (process.env.AUTO_INGEST_DEMO === 'true') {
        await orchestrator.ingestSource('demo-affiliate', { limit: 100, processImages: false });
        console.log('✅ Demo affiliate catalog seeded');
      }
    } catch (error) {
      console.warn('⚠️  Source seed skipped (run npm run ingest:demo):', error);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

      if (process.env.ENABLE_SCHEDULED_SCRAPING === 'true') {
        const { setupScrapingJobs } = require('./jobs/scraping.job');
        setupScrapingJobs();
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
