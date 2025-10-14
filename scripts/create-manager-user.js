#!/usr/bin/env node

/**
 * Script para criar usuário manager/gerente
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createManagerUser() {
  console.log('👤 Criando usuário manager/gerente...\n');

  try {
    // Verificar se já existe um manager
    const existingManager = await prisma.user.findFirst({
      where: { email: 'gerente@lanchonete.com' }
    });

    if (existingManager) {
      console.log('⚠️  Usuário manager já existe!');
      console.log(`   Email: ${existingManager.email}`);
      console.log(`   Nome: ${existingManager.name}`);
      console.log(`   Role: ${existingManager.role}`);
      console.log(`   Status: ${existingManager.isActive ? 'Ativo' : 'Inativo'}`);
      
      // Atualizar senha automaticamente
      const hashedPassword = await bcrypt.hash('123456', 12);
      
      await prisma.user.update({
        where: { id: existingManager.id },
        data: {
          password: hashedPassword,
          isActive: true,
          updatedAt: new Date()
        }
      });

      console.log('✅ Senha do manager atualizada!');
    } else {
      // Criar novo usuário manager
      const hashedPassword = await bcrypt.hash('123456', 12);

      const managerUser = await prisma.user.create({
        data: {
          email: 'gerente@lanchonete.com',
          name: 'Manager Expedição',
          password: hashedPassword,
          role: 'MANAGER',
          isActive: true
        }
      });

      console.log('✅ Usuário manager criado com sucesso!');
      console.log(`   ID: ${managerUser.id}`);
      console.log(`   Email: ${managerUser.email}`);
      console.log(`   Nome: ${managerUser.name}`);
      console.log(`   Role: ${managerUser.role}`);
      console.log(`   Status: ${managerUser.isActive ? 'Ativo' : 'Inativo'}`);
      console.log(`   Criado em: ${managerUser.createdAt.toLocaleString('pt-BR')}`);
    }

    // Verificar total de usuários
    const totalUsers = await prisma.user.count();
    const managerUsers = await prisma.user.count({
      where: { role: 'MANAGER' }
    });

    console.log(`\n📊 Estatísticas:`);
    console.log(`   Total de usuários: ${totalUsers}`);
    console.log(`   Managers: ${managerUsers}`);

    console.log('\n🔐 Credenciais de acesso:');
    console.log('   Email: gerente@lanchonete.com');
    console.log('   Senha: 123456');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário manager:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createManagerUser();
}

module.exports = { createManagerUser };

