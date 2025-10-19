#!/usr/bin/env node

/**
 * 🚀 Script de Configuração Automática do Supabase
 * 
 * Este script ajuda a configurar o Supabase no projeto
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configuração do Supabase para Lanchonete System\n');

// Verificar se o arquivo .env.local existe
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env.local não encontrado!');
    process.exit(1);
}

// Ler o arquivo .env.local
const envContent = fs.readFileSync(envPath, 'utf8');

// Verificar se as variáveis do Supabase estão configuradas
const hasSupabaseConfig = envContent.includes('supabase.co') && 
                         !envContent.includes('[SUA-SENHA]') && 
                         !envContent.includes('[PROJECT-REF]');

if (!hasSupabaseConfig) {
    console.log('⚠️  Configuração do Supabase necessária!\n');
    console.log('📋 Passos para configurar:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Crie um novo projeto ou acesse um existente');
    console.log('3. Vá para Settings → Database');
    console.log('4. Copie a Connection String');
    console.log('5. Edite o arquivo .env.local com suas credenciais\n');
    
    console.log('📖 Consulte o arquivo SUPABASE_SETUP.md para instruções detalhadas');
    console.log('\n❌ Configure o Supabase primeiro e execute este script novamente.');
    process.exit(1);
}

console.log('✅ Configuração do Supabase detectada!\n');

try {
    console.log('🔧 Gerando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Cliente Prisma gerado com sucesso!\n');

    console.log('🗄️  Executando migrações do banco...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrações executadas com sucesso!\n');

    console.log('🧪 Testando conexão com o banco...');
    execSync('node test-supabase-connection.js', { stdio: 'inherit' });
    console.log('✅ Conexão testada com sucesso!\n');

    console.log('🎉 Configuração do Supabase concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute: npm run dev');
    console.log('2. Teste as APIs de produtos e categorias');
    console.log('3. Configure as variáveis no seu provedor de hospedagem para deploy\n');

} catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Verifique se as credenciais do Supabase estão corretas');
    console.log('2. Confirme se o projeto Supabase está ativo');
    console.log('3. Teste a conexão manualmente: node test-supabase-connection.js');
    process.exit(1);
}