#!/usr/bin/env node

/**
 * Script para testar conexão com Supabase
 * Executa: node test-supabase-connection.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');

  // 1. Verificar variáveis de ambiente
  console.log('📋 Verificando variáveis de ambiente:');
  const dbUrl = process.env.DATABASE_URL;
  const postgresUrl = process.env.POSTGRES_URL;
  const postgresPrismaUrl = process.env.POSTGRES_PRISMA_URL;
  
  console.log(`DATABASE_URL: ${dbUrl ? '✅ Definida' : '❌ Não definida'}`);
  console.log(`POSTGRES_URL: ${postgresUrl ? '✅ Definida' : '❌ Não definida'}`);
  console.log(`POSTGRES_PRISMA_URL: ${postgresPrismaUrl ? '✅ Definida' : '❌ Não definida'}`);
  
  if (dbUrl) {
    const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (urlParts) {
      console.log(`Host: ${urlParts[3]}`);
      console.log(`Porta: ${urlParts[4]}`);
      console.log(`Database: ${urlParts[5].split('?')[0]}`);
    }
  }
  console.log('');

  try {
    // 2. Testar conexão básica
    console.log('🔌 Testando conexão básica...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // 3. Testar query simples
    console.log('🧪 Testando query simples...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query executada:', result);
    console.log('');

    // 4. Verificar tabelas existentes
    console.log('📊 Verificando tabelas existentes...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('Tabelas encontradas:');
    if (Array.isArray(tables) && tables.length > 0) {
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.table_name}`);
      });
    } else {
      console.log('  ❌ Nenhuma tabela encontrada');
    }
    console.log('');

    // 5. Testar tabelas específicas do projeto
    console.log('🏪 Testando tabelas do projeto...');
    
    try {
      const categoryCount = await prisma.category.count();
      console.log(`✅ Tabela 'Category': ${categoryCount} registros`);
    } catch (error) {
      console.log(`❌ Erro na tabela 'Category': ${error.message}`);
    }

    try {
      const productCount = await prisma.product.count();
      console.log(`✅ Tabela 'Product': ${productCount} registros`);
    } catch (error) {
      console.log(`❌ Erro na tabela 'Product': ${error.message}`);
    }

    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Tabela 'User': ${userCount} registros`);
    } catch (error) {
      console.log(`❌ Erro na tabela 'User': ${error.message}`);
    }

    try {
      const orderCount = await prisma.order.count();
      console.log(`✅ Tabela 'Order': ${orderCount} registros`);
    } catch (error) {
      console.log(`❌ Erro na tabela 'Order': ${error.message}`);
    }
    console.log('');

    // 6. Testar query de categorias (similar à API)
    console.log('🔍 Testando query de categorias...');
    try {
      const categories = await prisma.category.findMany({
        take: 5,
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              isAvailable: true,
            },
          },
        },
      });
      console.log(`✅ Categorias encontradas: ${categories.length}`);
      categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (${cat.products.length} produtos)`);
      });
    } catch (error) {
      console.log(`❌ Erro ao buscar categorias: ${error.message}`);
    }
    console.log('');

    // 7. Testar query de produtos (similar à API)
    console.log('🍔 Testando query de produtos...');
    try {
      const products = await prisma.product.findMany({
        take: 5,
        include: {
          category: true,
        },
      });
      console.log(`✅ Produtos encontrados: ${products.length}`);
      products.forEach((prod, index) => {
        console.log(`  ${index + 1}. ${prod.name} - R$ ${prod.price} (${prod.category?.name || 'Sem categoria'})`);
      });
    } catch (error) {
      console.log(`❌ Erro ao buscar produtos: ${error.message}`);
    }
    console.log('');

    console.log('🎉 Teste de conexão concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste de conexão:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    
    if (error.code) {
      console.error('Código:', error.code);
    }
    
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
    
    console.error('\n🔧 Possíveis soluções:');
    console.error('1. Verificar se DATABASE_URL está corretamente configurada');
    console.error('2. Verificar se o Supabase está online e acessível');
    console.error('3. Executar: npx prisma migrate deploy');
    console.error('4. Verificar credenciais de acesso ao banco');
    
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão encerrada.');
  }
}

// Executar teste
testSupabaseConnection()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });