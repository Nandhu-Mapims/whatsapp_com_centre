import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'APH Connect API - Employee Communication Platform (MAPIMS Hospitals)',
    tagline: 'One Platform. Every Employee. Connected.',
    time: new Date().toISOString(),
    env: ENV.NODE_ENV,
  });
});

// Mount modular API routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start listening
async function startServer() {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`[APH Connect Backend] Server running on http://localhost:${ENV.PORT}`);
    console.log(`[APH Connect Backend] Health endpoint available at http://localhost:${ENV.PORT}/api/health`);
  });
}

startServer();
