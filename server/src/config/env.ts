import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'campussync-fallback-secret-development-only',
  sessionSecret: process.env.SESSION_SECRET || 'campussync-fallback-session-secret',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/campussync?schema=public',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  emailApiKey: process.env.EMAIL_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@campus.edu',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  isProduction: process.env.NODE_ENV === 'production',
};
