const { execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const pgDataDir = path.resolve(rootDir, '.pgdata');
const nativeBin = path.resolve(
  rootDir,
  'node_modules/@embedded-postgres/windows-x64/native/bin'
);
const pgCtl = path.resolve(nativeBin, 'pg_ctl.exe');

try {
  execSync(`"${pgCtl}" stop -D "${pgDataDir}" -m fast`, { stdio: 'inherit' });
  console.log('[PostgreSQL] Server stopped.');
} catch (e) {
  console.log('[PostgreSQL] Server is not running or already stopped.');
}
