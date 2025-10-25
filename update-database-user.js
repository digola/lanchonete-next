#!/usr/bin/env node

/**
 * Script para atualizar credenciais do banco de dados com novo usuário
 * Usuário: digolanet@gmail.com
 * Senha: admin123
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando atualização das credenciais do banco de dados...\n');

// Configurações do novo usuário
const NEW_USER_CONFIG = {
  email: 'digolanet@gmail.com',
  password: 'admin123',
  // Estas URLs precisam ser atualizadas com as corretas do Supabase
  supabaseUrl: 'https://myerftqwarctdkstiimu.supabase.co',
  projectRef: 'myerftqwarctdkstiimu'
};

function updateEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    console.log('📝 Atualizando .env.local com novas credenciais...');
    
    // Atualizar DATABASE_URL e DIRECT_URL com nova senha
    // IMPORTANTE: Você precisa pegar a nova senha do painel do Supabase
    const newPassword = 'admin123'; // Esta será a nova senha gerada pelo Supabase
    
    // Substituir URLs antigas pelas novas (com nova senha)
    envContent = envContent.replace(
      /DATABASE_URL="postgresql:\/\/postgres\..*?:.*?@aws-1-sa-east-1\.pooler\.supabase\.com:6543\/postgres\?sslmode=require&pgbouncer=true&connection_limit=1&schema=public"/,
      `DATABASE_URL="postgresql://postgres.${NEW_USER_CONFIG.projectRef}:${newPassword}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public"`
    );
    
    envContent = envContent.replace(
      /DIRECT_URL="postgresql:\/\/postgres\..*?:.*?@db\..*?\.supabase\.co:5432\/postgres\?sslmode=require&schema=public"/,
      `DIRECT_URL="postgresql://postgres.${NEW_USER_CONFIG.projectRef}:${newPassword}@db.${NEW_USER_CONFIG.projectRef}.supabase.co:5432/postgres?sslmode=require&schema=public"`
    );
    
    // Backup do arquivo original
    fs.writeFileSync(envPath + '.backup', fs.readFileSync(envPath));
    
    // Escrever novo conteúdo
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Arquivo .env.local atualizado com sucesso!');
    console.log('📁 Backup criado em .env.local.backup');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar .env.local:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testando conexão com o banco de dados...');
  
  try {
    // Importar Prisma dinamicamente
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Teste simples de conexão
    await prisma.$connect();
    console.log('✅ Conexão Prisma estabelecida com sucesso!');
    
    // Teste de query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de teste executada:', result);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 SOLUÇÃO NECESSÁRIA:');
      console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
      console.log('2. Vá em Settings → Database');
      console.log('3. Reset a senha do banco de dados');
      console.log('4. Atualize as URLs no .env.local com a nova senha');
      console.log('5. Execute este script novamente');
    }
    
    return false;
  }
}

async function createAdminUser() {
  console.log('\n👤 Criando usuário administrador...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(NEW_USER_CONFIG.password, 12);
    
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: NEW_USER_CONFIG.email }
    });
    
    if (existingUser) {
      console.log('👤 Usuário já existe, atualizando...');
      
      const updatedUser = await prisma.user.update({
        where: { email: NEW_USER_CONFIG.email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      
      console.log('✅ Usuário administrador atualizado:', updatedUser.email);
    } else {
      console.log('👤 Criando novo usuário administrador...');
      
      const newUser = await prisma.user.create({
        data: {
          email: NEW_USER_CONFIG.email,
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
          isActive: true
        }
      });
      
      console.log('✅ Usuário administrador criado:', newUser.email);
    }
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 CONFIGURAÇÃO DO NOVO USUÁRIO SUPABASE');
  console.log('==========================================');
  console.log(`📧 Email: ${NEW_USER_CONFIG.email}`);
  console.log(`🔐 Senha: ${NEW_USER_CONFIG.password}`);
  console.log('==========================================\n');
  
  // Passo 1: Atualizar arquivo .env.local
  console.log('📋 PASSO 1: Atualizando configurações...');
  const envUpdated = updateEnvFile();
  
  if (!envUpdated) {
    console.log('❌ Falha na atualização do .env.local. Abortando...');
    process.exit(1);
  }
  
  // Passo 2: Testar conexão
  console.log('\n📋 PASSO 2: Testando conexão...');
  const connectionOk = await testDatabaseConnection();
  
  if (!connectionOk) {
    console.log('❌ Falha na conexão. Verifique as credenciais no Supabase.');
    console.log('\n🔧 PRÓXIMOS PASSOS MANUAIS:');
    console.log('1. Acesse https://supabase.com/dashboard');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em Settings → Database');
    console.log('4. Clique em "Reset database password"');
    console.log('5. Copie a nova senha e atualize o .env.local');
    process.exit(1);
  }
  
  // Passo 3: Criar usuário administrador
  console.log('\n📋 PASSO 3: Configurando usuário administrador...');
  const userCreated = await createAdminUser();
  
  if (userCreated) {
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('==========================================');
    console.log('✅ Banco de dados conectado');
    console.log('✅ Usuário administrador configurado');
    console.log(`✅ Login: ${NEW_USER_CONFIG.email}`);
    console.log(`✅ Senha: ${NEW_USER_CONFIG.password}`);
    console.log('==========================================');
  } else {
    console.log('\n⚠️  Conexão OK, mas falha ao criar usuário.');
    console.log('Execute: npx prisma migrate deploy');
    console.log('Depois execute este script novamente.');
  }
}

// Executar script
main().catch(console.error);