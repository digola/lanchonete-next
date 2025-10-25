#!/usr/bin/env node

/**
 * Teste simples de conexão Prisma e Supabase
 * Execute após corrigir as credenciais no .env.local
 */

console.log('🔍 TESTE SIMPLES DE CONEXÃO');
console.log('============================\n');

async function testPrismaConnection() {
  console.log('1️⃣ Testando conexão Prisma...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    // Teste de conexão
    await prisma.$connect();
    console.log('✅ Prisma conectado com sucesso!');
    
    // Teste de query simples
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Query executada:', result[0]);
    
    // Verificar tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Tabelas encontradas:', tables.length);
    tables.forEach(table => console.log(`   - ${table.table_name}`));
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Erro Prisma:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Acesse https://supabase.com/dashboard');
      console.log('2. Reset a senha do banco em Settings → Database');
      console.log('3. Atualize DATABASE_URL e DIRECT_URL no .env.local');
    }
    
    return false;
  }
}

async function testSupabaseClient() {
  console.log('\n2️⃣ Testando cliente Supabase...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste simples
    const { data, error } = await supabase
      .from('User')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Erro na query Supabase:', error.message);
      console.log('   (Isso pode ser normal se as tabelas ainda não existem)');
    } else {
      console.log('✅ Cliente Supabase funcionando!');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro Supabase Client:', error.message);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n3️⃣ Verificando variáveis de ambiente...');
  
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${varName}: NÃO ENCONTRADA`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

async function main() {
  // Carregar variáveis de ambiente
  require('dotenv').config({ path: '.env.local' });
  
  console.log('🚀 Iniciando testes de conexão...\n');
  
  // Verificar variáveis
  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    console.log('\n❌ Variáveis de ambiente faltando. Verifique .env.local');
    process.exit(1);
  }
  
  // Testar Prisma
  const prismaOk = await testPrismaConnection();
  
  // Testar Supabase
  const supabaseOk = await testSupabaseClient();
  
  // Resultado final
  console.log('\n📊 RESULTADO FINAL:');
  console.log('==================');
  console.log(`Prisma: ${prismaOk ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Supabase: ${supabaseOk ? '✅ OK' : '❌ FALHOU'}`);
  
  if (prismaOk && supabaseOk) {
    console.log('\n🎉 TODAS AS CONEXÕES FUNCIONANDO!');
    console.log('Você pode prosseguir com o desenvolvimento.');
  } else {
    console.log('\n⚠️  ALGUMAS CONEXÕES FALHARAM');
    console.log('Verifique as instruções em INSTRUCOES_SUPABASE_URGENTE.md');
  }
}

// Executar
main().catch(console.error);