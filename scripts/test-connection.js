const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Tentando conectar ao banco de dados...');
  console.log('URL (mascarada):', (process.env.DIRECT_URL || process.env.DATABASE_URL)?.replace(/:([^:@]+)@/, ':****@'));
  
  try {
    await prisma.$connect();
    console.log('Conexão bem sucedida!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro ao conectar:', error.message);
    process.exit(1);
  }
}

main();
