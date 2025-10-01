import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar apenas o usuário administrador
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lanchonete.com' },
    update: {
      password: hashedPassword,
      isActive: true,
    },
    create: {
      email: 'admin@lanchonete.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Usuário administrador criado/atualizado!');
  console.log('\n📋 Dados de acesso:');
  console.log('👤 Email: admin@lanchonete.com');
  console.log('🔑 Senha: admin123');
  console.log('🔐 Role: ADMIN');
  console.log('\n💡 Você pode adicionar manualmente os outros dados através do sistema.');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
