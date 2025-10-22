// Script para buscar usuário admin no banco (usa .env.local ou .env)
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function loadEnv() {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  const keys = ['DATABASE_URL','POSTGRES_PRISMA_URL','POSTGRES_URL','SUPABASE_DB_URL','DIRECT_URL','NODE_ENV'];
  for (const key of keys) {
    const regex = new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm');
    const match = envContent.match(regex);
    if (match) {
      let val = match[1].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
  if (!process.env.DATABASE_URL) {
    if (process.env.POSTGRES_PRISMA_URL) process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
    else if (process.env.POSTGRES_URL) process.env.DATABASE_URL = process.env.POSTGRES_URL;
    else if (process.env.SUPABASE_DB_URL) process.env.DATABASE_URL = process.env.SUPABASE_DB_URL;
  }
  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
}

async function main() {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@lanchonete.com' },
          { role: 'ADMINISTRADOR' }
        ]
      }
    });
    if (!admin) {
      console.log('Nenhum usuário admin encontrado.');
    } else {
      console.log('Usuário admin encontrado:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      });
    }
  } catch (err) {
    console.error('Erro ao consultar admin:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();