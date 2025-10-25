const { PrismaClient } = require('@prisma/client')

async function fixDatabaseConnection() {
  console.log('🔧 Diagnóstico e Correção da Conexão com Banco de Dados\n')
  
  // 1. Verificar variáveis de ambiente
  console.log('📋 Verificando configurações:')
  const requiredEnvs = ['DATABASE_URL', 'DIRECT_URL']
  
  for (const env of requiredEnvs) {
    if (process.env[env]) {
      console.log(`✅ ${env}: Configurada`)
      // Mascarar senha na exibição
      const maskedUrl = process.env[env].replace(/:([^:@]+)@/, ':***@')
      console.log(`   URL: ${maskedUrl}`)
    } else {
      console.log(`❌ ${env}: NÃO CONFIGURADA`)
    }
  }
  
  console.log('\n🔌 Testando conexões...')
  
  // 2. Testar conexão direta (para migrations)
  console.log('\n📡 Testando DIRECT_URL (conexão direta):')
  try {
    const directPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DIRECT_URL
        }
      }
    })
    
    await directPrisma.$connect()
    console.log('✅ Conexão direta: SUCESSO')
    await directPrisma.$disconnect()
  } catch (error) {
    console.log('❌ Conexão direta: FALHOU')
    console.log(`   Erro: ${error.message}`)
  }
  
  // 3. Testar conexão pooled (para runtime)
  console.log('\n🏊 Testando DATABASE_URL (conexão pooled):')
  try {
    const pooledPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
    
    await pooledPrisma.$connect()
    console.log('✅ Conexão pooled: SUCESSO')
    
    // Testar uma query simples
    const result = await pooledPrisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query de teste: SUCESSO')
    
    await pooledPrisma.$disconnect()
  } catch (error) {
    console.log('❌ Conexão pooled: FALHOU')
    console.log(`   Erro: ${error.message}`)
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔑 PROBLEMA DE AUTENTICAÇÃO DETECTADO!')
      console.log('   Possíveis causas:')
      console.log('   1. Senha do banco de dados expirou ou foi alterada')
      console.log('   2. Usuário não tem permissões adequadas')
      console.log('   3. Configuração de SSL/TLS incorreta')
      console.log('   4. Projeto Supabase pausado ou suspenso')
      
      console.log('\n🛠️  SOLUÇÕES RECOMENDADAS:')
      console.log('   1. Verificar no painel do Supabase se o projeto está ativo')
      console.log('   2. Regenerar a senha do banco de dados')
      console.log('   3. Verificar se as URLs estão corretas')
      console.log('   4. Testar conexão manual com psql ou outro cliente')
    }
  }
  
  // 4. Verificar status do schema
  console.log('\n📊 Verificando status do schema:')
  try {
    const { execSync } = require('child_process')
    const output = execSync('npx prisma migrate status', { encoding: 'utf8' })
    console.log('✅ Status das migrations:')
    console.log(output)
  } catch (error) {
    console.log('❌ Erro ao verificar migrations:')
    console.log(error.message)
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS RECOMENDADOS:')
  console.log('1. Se autenticação falhou: Verificar credenciais no Supabase')
  console.log('2. Se projeto pausado: Reativar no painel do Supabase')
  console.log('3. Se migrations pendentes: Executar "npx prisma migrate deploy"')
  console.log('4. Se tudo OK: Executar "npx prisma generate" para atualizar cliente')
}

// Executar diagnóstico
fixDatabaseConnection()
  .catch(console.error)
  .finally(() => process.exit(0))