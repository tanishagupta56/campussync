import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import campusRoutes from './routes/campus.routes';
import attendanceRoutes from './routes/attendance.routes';
import aiRoutes from './routes/ai.routes';
import searchRoutes from './routes/search.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: config.isProduction ? true : [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', campusRoutes);
app.use('/api', attendanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', searchRoutes);

// In production, serve Vite client/dist and fallback to index.html for non-API routes
if (config.isProduction) {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }
}

// 404 Handler for unhandled API calls
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[CampusSync Server] Running on port ${config.port} (env: ${config.nodeEnv})`);
});

export default app;
