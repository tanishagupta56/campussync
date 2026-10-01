const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const rootDir = __dirname;
const pgDataDir = path.resolve(rootDir, '.pgdata');
const nativeBin = path.resolve(
  rootDir,
  'node_modules/@embedded-postgres/windows-x64/native/bin'
);
const postgresExe = path.resolve(nativeBin, 'postgres.exe');
const initDbExe = path.resolve(nativeBin, 'initdb.exe');
const pidFile = path.resolve(pgDataDir, 'postmaster.pid');

async function isPortOpen(port = 5432) {
  const client = new Client({
    connectionString: `postgresql://postgres@127.0.0.1:${port}/postgres`,
    connectionTimeoutMillis: 1500,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function startDb() {
  if (!fs.existsSync(pgDataDir)) {
    fs.mkdirSync(pgDataDir, { recursive: true });
  }

  // Check if port 5432 is already responding
  if (await isPortOpen(5432)) {
    console.log('[PostgreSQL] Database server is already running and accepting connections on port 5432.');
    await verifyAndCreateDb();
    process.exit(0);
  }

  // Remove stale pid file if server is not responding
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
      console.log('[PostgreSQL] Removed stale postmaster.pid.');
    } catch (e) {}
  }

  // Check if cluster initialized
  const pgVersionFile = path.resolve(pgDataDir, 'PG_VERSION');
  if (!fs.existsSync(pgVersionFile)) {
    console.log('[PostgreSQL] Initializing new database cluster at', pgDataDir);
    execSync(`"${initDbExe}" -D "${pgDataDir}" -U postgres -A trust -E UTF8`, { stdio: 'inherit' });
  }

  console.log('[PostgreSQL] Launching postgres server as detached background process...');
  const child = spawn(postgresExe, ['-D', pgDataDir], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  // Poll for readiness up to 10 seconds
  for (let i = 0; i < 20; i++) {
    await new Promise((res) => setTimeout(res, 500));
    if (await isPortOpen(5432)) {
      console.log('[PostgreSQL] Server started successfully and ready on port 5432.');
      await verifyAndCreateDb();
      process.exit(0);
    }
  }

  console.error('[PostgreSQL] Timed out waiting for PostgreSQL to start.');
  process.exit(1);
}

async function verifyAndCreateDb() {
  try {
    const client = new Client({
      connectionString: 'postgresql://postgres@127.0.0.1:5432/postgres',
    });
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'campussync'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE campussync');
      console.log('[PostgreSQL] Created database "campussync".');
    } else {
      console.log('[PostgreSQL] Database "campussync" exists and ready.');
    }
    await client.end();
  } catch (e) {
    console.log('[PostgreSQL] Database verification notice:', e.message);
  }
}

startDb();
