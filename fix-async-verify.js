const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam ser corrigidos
const filesToFix = [
  'src/app/api/auth/refresh/route.ts',
  'src/app/api/tables/[id]/route.ts',
  'src/app/api/orders/[id]/items/route.ts',
  'src/app/api/auth/me/route.ts',
  'src/app/api/admin/orders/route.ts',
  'src/app/api/tables/[id]/clear/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/admin/reports/route.ts',
  'src/app/api/orders/route.ts',
  'src/app/api/tables/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/categories/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/orders/[id]/receive/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/orders/[id]/review/route.ts',
  'src/app/api/admin/notifications/cleanup/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/app/api/orders/finalize/route.ts',
  'src/app/api/categories/[id]/route.ts',
  'src/app/api/orders/[id]/route.ts',
  'src/app/api/notifications/mark-all-read/route.ts',
  'src/app/api/tables/[id]/status/route.ts',
  'src/app/api/notifications/[id]/route.ts',
  'src/app/api/auth/logout/route.ts',
  'src/app/api/upload/image/route.ts'
];

function fixVerifyTokenCalls(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Padrão para encontrar chamadas de verifyToken que não são await
    const patterns = [
      // const decoded = verifyToken(token);
      {
        regex: /const\s+(\w+)\s*=\s*verifyToken\(/g,
        replacement: 'const $1 = await verifyToken('
      },
      // const user = verifyToken(token); (já com await em alguns casos)
      {
        regex: /const\s+(\w+)\s*=\s*(?!await\s+)verifyToken\(/g,
        replacement: 'const $1 = await verifyToken('
      }
    ];

    patterns.forEach(pattern => {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

console.log('🔄 Iniciando correção das chamadas verifyToken...\n');

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fixVerifyTokenCalls(fullPath);
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
  }
});

console.log('\n✨ Correção concluída!');