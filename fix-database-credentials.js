#!/usr/bin/env node

/**
 * Script para diagnosticar e corrigir problemas de credenciais do banco
 * Nova senha: JzHoKngaUq5OBFv0
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 DIAGNÓSTICO DE CREDENCIAIS DO BANCO');
console.log('=====================================\n');

function checkEnvFile() {
  console.log('1️⃣ Verificando arquivo .env.local...');
  
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    
    // Verificar se a nova senha está presente
    const hasNewPassword = content.includes('JzHoKngaUq5OBFv0');
    const hasOldPassword = content.includes('admin123');
    
    console.log(`✅ Arquivo .env.local encontrado`);
    console.log(`${hasNewPassword ? '✅' : '❌'} Nova senha (JzHoKngaUq5OBFv0) presente`);
    console.log(`${hasOldPassword ? '⚠️' : '✅'} Senha antiga (admin123) ${hasOldPassword ? 'ainda presente' : 'removida'}`);
    
    // Extrair URLs atuais
    const databaseUrlMatch = content.match(/DATABASE_URL="([^"]+)"/);
    const directUrlMatch = content.match(/DIRECT_URL="([^"]+)"/);
    
    if (databaseUrlMatch) {
      console.log(`📋 DATABASE_URL atual: ${databaseUrlMatch[1].substring(0, 50)}...`);
    }
    
    if (directUrlMatch) {
      console.log(`📋 DIRECT_URL atual: ${directUrlMatch[1].substring(0, 50)}...`);
    }
    
    return { hasNewPassword, hasOldPassword, content };
    
  } catch (error) {
    console.error('❌ Erro ao ler .env.local:', error.message);
    return null;
  }
}

async function testDirectConnection() {
  console.log('\n2️⃣ Testando conexão direta...');
  
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      host: 'db.myerftqwarctdkstiimu.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres.myerftqwarctdkstiimu',
      password: 'JzHoKngaUq5OBFv0',
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Conexão direta PostgreSQL estabelecida!');
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Query executada:', result.rows[0]);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.error('❌ Erro na conexão direta:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('🔧 A senha pode estar incorreta ou o usuário não existe');
    }
    
    return false;
  }
}

async function testPooledConnection() {
  console.log('\n3️⃣ Testando conexão pooled (PgBouncer)...');
  
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      host: 'aws-1-sa-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.myerftqwarctdkstiimu',
      password: 'JzHoKngaUq5OBFv0',
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Conexão pooled estabelecida!');
    
    const result = await client.query('SELECT 1 as test');
    console.log('✅ Query executada:', result.rows[0]);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.error('❌ Erro na conexão pooled:', error.message);
    return false;
  }
}

async function testPrismaConnection() {
  console.log('\n4️⃣ Testando conexão Prisma...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error'],
    });
    
    await prisma.$connect();
    console.log('✅ Prisma conectado!');
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query Prisma executada:', result);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Erro Prisma:', error.message);
    return false;
  }
}

function generateCorrectUrls() {
  console.log('\n5️⃣ Gerando URLs corretas...');
  
  const newPassword = 'JzHoKngaUq5OBFv0';
  const projectRef = 'myerftqwarctdkstiimu';
  
  const databaseUrl = `postgresql://postgres.${projectRef}:${newPassword}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public`;
  const directUrl = `postgresql://postgres.${projectRef}:${newPassword}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require&schema=public`;
  
  console.log('📋 URLs corretas:');
  console.log(`DATABASE_URL="${databaseUrl}"`);
  console.log(`DIRECT_URL="${directUrl}"`);
  
  return { databaseUrl, directUrl };
}

async function main() {
  console.log('🚀 Iniciando diagnóstico completo...\n');
  
  // Verificar arquivo .env
  const envCheck = checkEnvFile();
  if (!envCheck) {
    console.log('❌ Falha ao verificar .env.local');
    process.exit(1);
  }
  
  // Gerar URLs corretas
  const urls = generateCorrectUrls();
  
  // Testar conexões
  const directOk = await testDirectConnection();
  const pooledOk = await testPooledConnection();
  const prismaOk = await testPrismaConnection();
  
  // Resultado final
  console.log('\n📊 RESULTADO DO DIAGNÓSTICO:');
  console.log('============================');
  console.log(`Arquivo .env.local: ${envCheck.hasNewPassword ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Conexão Direta: ${directOk ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Conexão Pooled: ${pooledOk ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Conexão Prisma: ${prismaOk ? '✅ OK' : '❌ FALHOU'}`);
  
  if (directOk && pooledOk && prismaOk) {
    console.log('\n🎉 TODAS AS CONEXÕES FUNCIONANDO!');
    console.log('Você pode prosseguir com o desenvolvimento.');
  } else {
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    
    if (!directOk || !pooledOk) {
      console.log('1. Verifique se a senha foi resetada corretamente no Supabase');
      console.log('2. Confirme que o projeto não está pausado');
      console.log('3. Verifique se o usuário tem permissões corretas');
    }
    
    if (!prismaOk && (directOk || pooledOk)) {
      console.log('4. Execute: npx prisma generate');
      console.log('5. Execute: npx prisma migrate deploy');
    }
  }
}

// Executar
main().catch(console.error);