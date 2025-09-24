#!/usr/bin/env node

/**
 * Script simples para criar usuário administrador
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('👤 Criando usuário administrador...\n');

  try {
    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@lanchonete.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Usuário administrador já existe!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      console.log(`   Status: ${existingAdmin.isActive ? 'Ativo' : 'Inativo'}`);
      
      // Atualizar senha automaticamente
      const hashedPassword = await bcrypt.hash('a123456', 12);
      
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          isActive: true,
          updatedAt: new Date()
        }
      });

      console.log('✅ Senha do administrador atualizada!');
    } else {
      // Criar novo usuário admin
      const hashedPassword = await bcrypt.hash('a123456', 12);

      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@lanchonete.com',
          name: 'Administrador do Sistema',
          password: hashedPassword,
          role: 'ADMINISTRADOR',
          isActive: true
        }
      });

      console.log('✅ Usuário administrador criado com sucesso!');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Nome: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}`);
    }

    // Verificar total de usuários
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({
      where: { role: 'ADMINISTRADOR' }
    });

    console.log(`\n📊 Estatísticas:`);
    console.log(`   Total de usuários: ${totalUsers}`);
    console.log(`   Administradores: ${adminUsers}`);

    console.log('\n🔐 Credenciais de acesso:');
    console.log('   Email: admin@lanchonete.com');
    console.log('   Senha: a123456');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
