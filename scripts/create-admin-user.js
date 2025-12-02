#!/usr/bin/env node

/**
 * Script para criar usuário administrador
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
      console.log(`   Criado em: ${existingAdmin.createdAt.toLocaleString('pt-BR')}`);
      
      // Perguntar se quer atualizar a senha
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('\nDeseja atualizar a senha? (s/n): ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
        const hashedPassword = await bcrypt.hash('a123456', 12);
        
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            password: hashedPassword,
            isActive: true,
            updatedAt: new Date()
          }
        });

        console.log('✅ Senha do administrador atualizada com sucesso!');
      } else {
        console.log('ℹ️  Senha mantida como estava.');
      }
    } else {
      // Criar novo usuário admin
      const hashedPassword = await bcrypt.hash('a123456', 12);

      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@lanchonete.com',
          name: 'Administrador do Sistema',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });

      console.log('✅ Usuário administrador criado com sucesso!');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Nome: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Status: ${adminUser.isActive ? 'Ativo' : 'Inativo'}`);
      console.log(`   Criado em: ${adminUser.createdAt.toLocaleString('pt-BR')}`);
    }

    // Verificar total de usuários
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({
      where: { role: 'ADMIN' }
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

// Executar se chamado diretamente
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };
