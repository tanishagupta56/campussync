import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import campusRoutes from './routes/campus.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible assets and Three.js canvas in dev
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration for React frontend
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'CampusSync Backend API',
    timestamp: new Date().toISOString(),
    timezone: config.defaultTimezone,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', campusRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Centralized Secure Error Handler
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[CampusSync Server] Running on http://localhost:${config.port}`);
  console.log(`[CampusSync Server] Environment: ${config.nodeEnv}`);
});

export default app;
