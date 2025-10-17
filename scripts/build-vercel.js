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

async function main() {
  try {
    // 1) Map aliases FIRST to ensure schema switch sees DATABASE_URL
    mapEnvAliases();

    // 2) Switch schema automatically
    run('node', ['scripts/switch-schema-auto.js']);

    // 3) Generate Prisma client
    run('npx', ['prisma', 'generate']);

    // 4) Migrate if env is complete
    if (process.env.DIRECT_URL && process.env.DATABASE_URL) {
      run('npx', ['prisma', 'migrate', 'deploy']);
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