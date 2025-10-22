// Atualiza a senha do usuário admin (usa .env.local/.env)
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
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
  const [newPassword, emailArg] = process.argv.slice(2);
  if (!newPassword) {
    console.error('Uso: node scripts/update-admin-password.js <nova_senha> [email]');
    process.exit(1);
  }
  const email = emailArg || 'admin@lanchonete.com';

  loadEnv();
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`Usuário com email ${email} não encontrado.`);
      process.exit(1);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
      select: { id: true, email: true, name: true, role: true, updatedAt: true }
    });

    console.log('Senha atualizada com sucesso para o usuário:', updated);
    console.log('Dica: faça login com o novo password agora.');
  } catch (err) {
    console.error('Erro ao atualizar senha do admin:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();