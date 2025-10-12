// Script para alternar entre schemas PostgreSQL e SQLite
const fs = require('fs');
const path = require('path');

function switchSchema() {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const sqliteSchemaPath = path.join(__dirname, '..', 'prisma', 'schema-sqlite.prisma');
  
  const target = process.argv[2] || 'sqlite';
  
  if (target === 'sqlite') {
    console.log('🗃️ Alternando para SQLite...');
    // Não sobrescrever schema-postgresql.prisma
    
    // Copiar schema SQLite
    if (fs.existsSync(sqliteSchemaPath)) {
      fs.copyFileSync(sqliteSchemaPath, schemaPath);
      console.log('✅ Schema alterado para SQLite');
    } else {
      console.error('❌ Schema SQLite não encontrado');
      return;
    }
    
  } else if (target === 'postgresql') {
    console.log('🐘 Alternando para PostgreSQL...');
    
    const postgresqlSchemaPath = path.join(__dirname, '..', 'prisma', 'schema-postgresql.prisma');
    
    if (fs.existsSync(postgresqlSchemaPath)) {
      fs.copyFileSync(postgresqlSchemaPath, schemaPath);
      console.log('✅ Schema alterado para PostgreSQL');
    } else {
      console.error('❌ Schema PostgreSQL não encontrado');
      return;
    }
    
  } else {
    console.log('❌ Opção inválida. Use: sqlite ou postgresql');
    return;
  }
  
  console.log('📋 Próximos passos:');
  console.log('   1. npm run db:generate');
  console.log('   2. npm run db:push');
  console.log('   3. npm run db:seed');
}

switchSchema();
