// @ts-ignore
import { EmbeddedPostgres } from 'embedded-postgres';
import { Client } from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let embeddedPgInstance: EmbeddedPostgres | null = null;

export async function isPostgresRunning(connectionString: string): Promise<boolean> {
  const client = new Client({ connectionString, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

export async function ensurePostgresRunning(): Promise<string> {
  const targetUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campussync?schema=public';
  
  // 1. First check if external / local PostgreSQL is already running
  const running = await isPostgresRunning(targetUrl);
  if (running) {
    console.log('[Database] Connected to active PostgreSQL server at', targetUrl);
    return targetUrl;
  }

  // Also check if default postgres without database name connects (e.g. postgresql://postgres:postgres@localhost:5432/postgres)
  const defaultUrl = 'postgresql://postgres:postgres@localhost:5432/postgres';
  const defaultRunning = await isPostgresRunning(defaultUrl);
  if (defaultRunning) {
    // Create campussync database if it doesn't exist
    try {
      const client = new Client({ connectionString: defaultUrl });
      await client.connect();
      const checkRes = await client.query("SELECT 1 FROM pg_database WHERE datname = 'campussync'");
      if (checkRes.rowCount === 0) {
        await client.query('CREATE DATABASE campussync');
        console.log('[Database] Created database "campussync"');
      }
      await client.end();
      return targetUrl;
    } catch (e) {
      console.warn('[Database] Could not verify/create database:', e);
    }
  }

  // 2. If not running, start embedded PostgreSQL
  console.log('[Database] No running PostgreSQL found. Initializing portable embedded PostgreSQL server...');
  const dataDir = path.resolve(__dirname, '../../.pgdata');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    embeddedPgInstance = new EmbeddedPostgres({
      databaseDir: dataDir,
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: 'campussync',
      persistent: true,
    });

    try {
      await embeddedPgInstance.initialise();
    } catch (initErr: any) {
      // If already initialized, ignore
      if (!initErr.message?.includes('already exists')) {
        console.warn('[Database] Init warning:', initErr.message);
      }
    }

    await embeddedPgInstance.start();
    console.log('[Database] Portable PostgreSQL server started on port 5432.');
    const localUrl = 'postgresql://postgres:password@localhost:5432/campussync?schema=public';
    process.env.DATABASE_URL = localUrl;
    return localUrl;
  } catch (err: any) {
    console.error('[Database] Failed to start embedded PostgreSQL:', err);
    throw err;
  }
}

export async function stopEmbeddedPostgres() {
  if (embeddedPgInstance) {
    console.log('[Database] Stopping embedded PostgreSQL...');
    await embeddedPgInstance.stop();
  }
}

if (require.main === module) {
  ensurePostgresRunning()
    .then((url) => {
      console.log('[Database] Ready. Connection URL:', url);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Database] Error:', err);
      process.exit(1);
    });
}
