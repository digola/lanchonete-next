/**
 * Vercel build script (cross‑platform, readable)
 *
 * Steps:
 * 1) Map Supabase aliases to Prisma expected envs (DATABASE_URL/DIRECT_URL)
 * 2) Switch Prisma schema automatically (postgresql vs sqlite)
 * 3) Generate Prisma client
 * 4) Run migrations in production if DATABASE_URL and DIRECT_URL are present
 * 5) Build Next.js
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(msg) {
  console.log(`[build] ${msg}`);
}

function run(cmd, args = [], opts = {}) {
  log(`Running: ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: process.env,
    shell: false,
    ...opts,
  });
  if (res.error) {
    throw res.error;
  }
  if (typeof res.status === 'number' && res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')} (exit ${res.status})`);
  }
}

function mapEnvAliases() {
  // Map DATABASE_URL from Supabase aliases
  if (!process.env.DATABASE_URL) {
    if (process.env.POSTGRES_PRISMA_URL) {
      process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
      log('Set DATABASE_URL from POSTGRES_PRISMA_URL');
    } else if (process.env.POSTGRES_URL) {
      process.env.DATABASE_URL = process.env.POSTGRES_URL;
      log('Set DATABASE_URL from POSTGRES_URL');
    }
  }

  // Map DIRECT_URL / non-pooling
  if (!process.env.DIRECT_URL) {
    if (process.env.DATABASE_URL_NON_POOLING) {
      process.env.DIRECT_URL = process.env.DATABASE_URL_NON_POOLING;
      log('Set DIRECT_URL from DATABASE_URL_NON_POOLING');
    } else if (process.env.POSTGRES_URL_NON_POOLING) {
      process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING;
      log('Set DIRECT_URL from POSTGRES_URL_NON_POOLING');
    }
  }
}

function ensurePgbouncerOn6543() {
  const urlStr = process.env.DATABASE_URL;
  if (!urlStr) return;
  try {
    const u = new URL(urlStr);
    if (u.port === '6543') {
      if (!u.searchParams.has('pgbouncer')) {
        u.searchParams.set('pgbouncer', 'true');
        process.env.DATABASE_URL = u.toString();
        log('Appended pgbouncer=true to DATABASE_URL (port 6543)');
      }
      if (!u.searchParams.has('sslmode')) {
        u.searchParams.set('sslmode', 'require');
        process.env.DATABASE_URL = u.toString();
        log('Appended sslmode=require to DATABASE_URL');
      }
    }
  } catch (_) {
    // ignore parse issues; user may use non-standard URL
  }
}

function validateDbEnv() {
  const db = process.env.DATABASE_URL || '';
  const direct = process.env.DIRECT_URL || '';
  if (/host:5432/.test(db)) {
    console.warn('⚠️ DATABASE_URL parece conter placeholder "host:5432". Configure um host real (ex.: db.<project-ref>.supabase.co)');
  }
  if (/host:5432/.test(direct)) {
    console.warn('⚠️ DIRECT_URL parece conter placeholder "host:5432". Configure um host real (ex.: db.<project-ref>.supabase.co)');
  }
  // Aviso: migrations devem usar porta 5432 (sem pool)
  try {
    if (direct) {
      const du = new URL(direct);
      if (du.port && du.port !== '5432') {
        console.warn('⚠️ DIRECT_URL não está na porta 5432. Recomenda-se usar 5432 para migrações (conexão direta, sem pool).');
      }
    }
  } catch (_) {}
}

function hasPlaceholderHost(url) {
  if (!url) return false;
  return /(^|@)host:5432/i.test(url) || /(^|@)host(?::|\/)/i.test(url);
}

function shouldSkipMigrations() {
  const flags = [
    process.env.SKIP_PRISMA_MIGRATIONS,
    process.env.PRISMA_SKIP_MIGRATIONS,
    process.env.VERCEL_SKIP_MIGRATIONS,
  ];
  if (flags.some((v) => String(v).toLowerCase() === 'true')) {
    log('Skipping prisma migrations due to skip flag (SKIP_PRISMA_MIGRATIONS/PRISMA_SKIP_MIGRATIONS/VERCEL_SKIP_MIGRATIONS)');
    return true;
  }
  if (hasPlaceholderHost(process.env.DIRECT_URL)) {
    log('Skipping prisma migrations: DIRECT_URL contém host placeholder (ex.: "host:5432").');
    return true;
  }
  return false;
}

function switchSchemaAuto() {
  const prismaDir = path.join(process.cwd(), 'prisma');
  const targetPath = path.join(prismaDir, 'schema.prisma');
  const isVercel = !!process.env.VERCEL;
  const isProdLike = process.env.NODE_ENV === 'production' || isVercel;
  const dbUrl = process.env.DATABASE_URL || '';
  const usePostgres = isProdLike || /^postgres(ql)?:\/\//i.test(dbUrl);
  const sourceFile = usePostgres ? 'schema-postgresql.prisma' : 'schema-sqlite.prisma';
  const sourcePath = path.join(prismaDir, sourceFile);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source schema not found: ${sourcePath}`);
  }
  fs.copyFileSync(sourcePath, targetPath);
  log(`Active schema set to: ${sourceFile} -> schema.prisma`);
}

async function main() {
  try {
    // 1) Map aliases FIRST to ensure schema switch sees DATABASE_URL
    mapEnvAliases();
    ensurePgbouncerOn6543();
    validateDbEnv();

    // 2) Switch schema automatically
    switchSchemaAuto();

    // 3) Generate Prisma client
    run('npx', ['prisma', 'generate']);

    // 4) Migrate if env is complete and not skipped
    if (process.env.DIRECT_URL && process.env.DATABASE_URL) {
      if (shouldSkipMigrations()) {
        log('Prisma migrate deploy SKIPPED. Prossiga com o build.');
      } else {
        run('npx', ['prisma', 'migrate', 'deploy']);
      }
    } else {
      log('Skipping prisma migrate deploy: require DATABASE_URL and DIRECT_URL (or POSTGRES_URL_NON_POOLING/DATABASE_URL_NON_POOLING)');
    }

    // 5) Build Next.js
    run('npx', ['next', 'build']);

    log('Build completed successfully.');
  } catch (err) {
    console.error('[build] ERROR:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();