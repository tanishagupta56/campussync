const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const rootDir = __dirname;
const pgDataDir = path.resolve(rootDir, '.pgdata');
const nativeBin = path.resolve(
  rootDir,
  'node_modules/@embedded-postgres/windows-x64/native/bin'
);
const pgCtl = path.resolve(nativeBin, 'pg_ctl.exe');
const initDb = path.resolve(nativeBin, 'initdb.exe');
const pidFile = path.resolve(pgDataDir, 'postmaster.pid');

async function checkPort(port = 5432) {
  const client = new Client({
    connectionString: `postgresql://postgres:password@127.0.0.1:${port}/postgres`,
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

async function main() {
  if (await checkPort(5432)) {
    console.log('[PostgreSQL] Server is already running and accepting connections on port 5432.');
    process.exit(0);
  }

  // Check if cluster initialized
  const pgVersionFile = path.resolve(pgDataDir, 'PG_VERSION');
  if (!fs.existsSync(pgVersionFile)) {
    console.log('[PostgreSQL] Initializing cluster at', pgDataDir);
    execSync(`"${initDb}" -D "${pgDataDir}" -U postgres -A trust -E UTF8`, { stdio: 'inherit' });
  }

  // Remove stale pid file if server was not running
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
    } catch (e) {}
  }

  console.log('[PostgreSQL] Starting PostgreSQL server via pg_ctl...');
  try {
    execSync(`"${pgCtl}" start -D "${pgDataDir}"`, { stdio: 'inherit' });
    console.log('[PostgreSQL] Server started successfully.');
  } catch (e) {
    console.warn('[PostgreSQL] Start notice:', e.message);
  }

  // Verify connection
  const ready = await checkPort(5432);
  if (ready) {
    console.log('[PostgreSQL] Database ready on port 5432.');
    process.exit(0);
  } else {
    console.error('[PostgreSQL] Could not establish connection on port 5432.');
    process.exit(1);
  }
}

main();
