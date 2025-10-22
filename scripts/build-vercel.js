#!/usr/bin/env node
/*
  Build script para Vercel e ambiente local.
  - Carrega variáveis de ambiente necessárias
  - Gera o Prisma Client (sem rodar migrações por padrão)
  - Executa next build
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(step, details = '') {
  const ts = new Date().toISOString();
  console.log(`[build-vercel] ${ts} | ${step}${details ? ' -> ' + details : ''}`);
}

function tryLoadDotenv() {
  // Em ambiente local, tentar carregar .env.vercel
  const dotenvPath = path.join(process.cwd(), '.env.vercel');
  if (fs.existsSync(dotenvPath)) {
    log('dotenv', 'carregando .env.vercel');
    try {
      require('dotenv').config({ path: dotenvPath });
    } catch (e) {
      log('dotenv ERRO', e.message);
    }
  } else {
    log('dotenv', 'arquivo .env.vercel não encontrado (ok em Vercel)');
  }
}

function ensureEnv() {
  const required = [
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
  ];
  // Em produção, banco é opcional durante build se pulamos migrações
  const optional = ['DATABASE_URL', 'DIRECT_URL', 'VERCEL_SKIP_MIGRATIONS'];

  required.forEach((key) => {
    if (!process.env[key]) {
      log('env WARN', `${key} não definido`);
    } else {
      log('env OK', `${key} presente`);
    }
  });

  optional.forEach((key) => {
    if (process.env[key]) {
      log('env INFO', `${key}=${process.env[key]}`);
    }
  });
}

function prismaGenerate() {
  log('prisma', 'gerando Prisma Client');
  try {
    // Usar o bin local do prisma
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (e) {
    log('prisma ERRO', e.message || String(e));
    throw e;
  }
}

function maybeRunMigrations() {
  const skip = String(process.env.VERCEL_SKIP_MIGRATIONS || 'true').toLowerCase() === 'true';
  if (skip) {
    log('migrations', 'puladas (VERCEL_SKIP_MIGRATIONS=true)');
    return;
  }
  if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
    log('migrations WARN', 'sem DIRECT_URL/DATABASE_URL, migrações serão puladas');
    return;
  }
  try {
    // Em produção, é mais seguro usar migrate deploy
    log('migrations', 'rodando prisma migrate deploy');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (e) {
    log('migrations ERRO', e.message || String(e));
    throw e;
  }
}

function nextBuild() {
  log('next', 'executando next build');
  try {
    execSync('npx next build', { stdio: 'inherit' });
  } catch (e) {
    log('next ERRO', e.message || String(e));
    throw e;
  }
}

(function run() {
  log('start', 'build-vercel.js');
  tryLoadDotenv();
  ensureEnv();
  prismaGenerate();
  maybeRunMigrations();
  nextBuild();
  log('done', 'build finalizado com sucesso');
})();