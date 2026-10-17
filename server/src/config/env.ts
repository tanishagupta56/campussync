import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Strict validation in production: fail fast if secrets are missing
if (isProduction) {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`[FATAL] Missing required production environment variable: ${key}`);
    }
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || (isProduction ? '' : 'campussync-fallback-secret-development-only'),
  sessionSecret: process.env.SESSION_SECRET || (isProduction ? '' : 'campussync-fallback-session-secret'),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/campussync?schema=public',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  emailApiKey: process.env.EMAIL_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@campus.edu',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  isProduction,
  devShowOtp: process.env.DEV_SHOW_OTP === 'true',
};
