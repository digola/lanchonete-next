// Setup environment file for production deployment
// Generates a .env.vercel file with all required variables for the app
// Supports Supabase (recommended) and allows custom pooler host override
// Usage (Supabase):
//   node scripts/setup-env.js --provider supabase \
//     --project-ref <PROJECT_REF> \
//     --db-password <DB_PASSWORD> \
//     --app-url https://your-app.vercel.app \
//     --nextauth-url https://your-app.vercel.app \
//     [--pooler-host aws-0-sa-east-1.pooler.supabase.com] \
//     [--app-name "Sistema Lanchonete"]
//
// Notes:
// - The generated .env.vercel should be imported into Vercel Project Settings → Environment Variables (Preview & Production)
// - Do NOT commit .env.vercel to version control (contains secrets)
// - Prisma migrations use DIRECT_URL (non-pooled); runtime uses DATABASE_URL (pooled)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        out[key] = true; // flag
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

function genSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function mask(val) {
  if (!val) return '<empty>';
  const visible = 4;
  if (val.length <= visible) return '*'.repeat(val.length);
  return val.slice(0, visible) + '...' + '*'.repeat(Math.max(0, val.length - visible));
}

function buildSupabaseEnv(opts) {
  const projectRef = opts['project-ref'];
  const dbPassword = opts['db-password'];
  const appUrl = opts['app-url'] || 'https://your-app.vercel.app';
  const nextauthUrl = opts['nextauth-url'] || appUrl;
  const poolerHost = opts['pooler-host'] || 'aws-0-sa-east-1.pooler.supabase.com';
  const appName = opts['app-name'] || 'Sistema Lanchonete';

  if (!projectRef) {
    throw new Error('Missing --project-ref for Supabase');
  }
  if (!dbPassword) {
    throw new Error('Missing --db-password for Supabase');
  }

  const pooled = `postgresql://postgres:${encodeURIComponent(dbPassword)}@${poolerHost}:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public`;
  const direct = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require&schema=public`;

  const jwtSecret = genSecret();
  const nextauthSecret = genSecret();

  const envContent = `############################################\n` +
    `# .env para importação no Vercel (Produção)\n` +
    `# Gerado automaticamente por scripts/setup-env.js\n` +
    `# Importe no Vercel: Project Settings → Environment Variables\n` +
    `############################################\n\n` +
    `# Ambiente\n` +
    `NODE_ENV="production"\n\n` +
    `# Database (Supabase)\n` +
    `DATABASE_URL="${pooled}"\n` +
    `DIRECT_URL="${direct}"\n` +
    `# Compatibilidade (se usar Vercel Postgres, o build mapeia NON_POOLING → DIRECT_URL)\n` +
    `DATABASE_URL_NON_POOLING="${direct}"\n\n` +
    `# JWT\n` +
    `JWT_SECRET="${jwtSecret}"\n` +
    `JWT_EXPIRES_IN="7d"\n` +
    `JWT_REFRESH_EXPIRES_IN="30d"\n\n` +
    `# NextAuth\n` +
    `NEXTAUTH_SECRET="${nextauthSecret}"\n` +
    `NEXTAUTH_URL="${nextauthUrl}"\n\n` +
    `# Uploads\n` +
    `UPLOAD_MAX_SIZE="10485760" # 10MB\n` +
    `UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/webp"\n\n` +
    `# App\n` +
    `APP_NAME="${appName}"\n` +
    `APP_URL="${appUrl}"\n` +
    `# Se precisar usar no cliente (browser), descomente a linha abaixo:\n` +
    `# NEXT_PUBLIC_APP_NAME="${appName}"\n\n` +
    `# Email (opcional)\n` +
    `SMTP_HOST=""\n` +
    `SMTP_PORT=""\n` +
    `SMTP_USER=""\n` +
    `SMTP_PASS=""\n` +
    `SMTP_FROM=""\n\n` +
    `# Pagamentos (opcional)\n` +
    `STRIPE_SECRET_KEY=""\n` +
    `STRIPE_PUBLISHABLE_KEY=""\n` +
    `PAGSEGURO_TOKEN=""\n\n` +
    `# Analytics (opcional)\n` +
    `GOOGLE_ANALYTICS_ID=""\n`;

  return { envContent, summary: { pooled, direct, appUrl, nextauthUrl, appName } };
}

function main() {
  try {
    const args = parseArgs();
    const provider = (args.provider || '').toLowerCase();
    if (!provider) {
      throw new Error('Missing --provider. Supported: supabase');
    }

    let result;
    switch (provider) {
      case 'supabase':
        result = buildSupabaseEnv(args);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}. Supported: supabase`);
    }

    const outFile = path.join(process.cwd(), '.env.vercel');
    fs.writeFileSync(outFile, result.envContent, { encoding: 'utf-8' });

    console.log('✅ .env.vercel gerado com sucesso.');
    console.log('Resumo (valores mascarados):');
    console.log(' - DATABASE_URL (pooled):', mask(result.summary.pooled));
    console.log(' - DIRECT_URL (non-pooled):', mask(result.summary.direct));
    console.log(' - NEXTAUTH_URL:', result.summary.nextauthUrl);
    console.log(' - APP_URL:', result.summary.appUrl);
    console.log(' - APP_NAME:', result.summary.appName);
    console.log('\nPróximos passos:');
    console.log(' 1) Não comite .env.vercel no repositório (contém segredos).');
    console.log(' 2) Importe as variáveis no Vercel: Project → Settings → Environment Variables (Preview & Production).');
    console.log(' 3) Faça um Redeploy com Clear Build Cache.');
    console.log(' 4) Verifique os logs do build para confirmar prisma migrate deploy.');
  } catch (err) {
    console.error('❌ Falha ao gerar .env.vercel:', err.message);
    process.exit(1);
  }
}

main();