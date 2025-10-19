const fs = require('fs');
const path = require('path');

// Funções que devem usar auth-server.ts em vez de auth.ts
const serverOnlyFunctions = [
  'getTokenFromRequest',
  'verifyToken', 
  'hasPermission',
  'hashPassword',
  'verifyPassword',
  'generateTokenPair',
  'generateAccessToken',
  'generateRefreshToken',
  'refreshAccessToken',
  'isValidEmail',
  'isValidPassword',
  'isValidName'
];

// Funções que permanecem em auth.ts (Edge Runtime compatible)
const edgeFunctions = [
  'createAuthError',
  'createAuthSuccess',
  'COOKIE_CONFIG',
  'REFRESH_COOKIE_CONFIG'
];

function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Procurar por importações de @/lib/auth
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/auth['"]/g;
    
    content = content.replace(importRegex, (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      
      const serverImports = [];
      const edgeImports = [];
      
      importList.forEach(imp => {
        if (serverOnlyFunctions.includes(imp)) {
          serverImports.push(imp);
        } else if (edgeFunctions.includes(imp)) {
          edgeImports.push(imp);
        } else {
          // Se não soubermos, mantemos em auth.ts por segurança
          edgeImports.push(imp);
        }
      });
      
      let replacement = '';
      
      if (serverImports.length > 0) {
        replacement += `import { ${serverImports.join(', ')} } from '@/lib/auth-server';\n`;
        modified = true;
      }
      
      if (edgeImports.length > 0) {
        replacement += `import { ${edgeImports.join(', ')} } from '@/lib/auth';`;
      }
      
      return replacement;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Atualizado: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

// Lista de arquivos para atualizar (baseado na busca anterior)
const filesToUpdate = [
  'src/app/api/users/[id]/route.ts',
  'src/app/api/admin/inventory/movements/route.ts',
  'src/app/api/admin/analytics/charts/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/orders/[id]/route.ts',
  'src/app/api/orders/[id]/review/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/admin/settings/route.ts',
  'src/app/api/auth/me/route.ts',
  'src/app/api/notifications/mark-all-read/route.ts',
  'src/app/api/tables/[id]/clear/route.ts',
  'src/app/api/orders/finalize/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/admin/notifications/cleanup/route.ts',
  'src/app/api/tables/[id]/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/auth/logout/route.ts',
  'src/app/api/admin/inventory/alerts/route.ts',
  'src/app/api/orders/[id]/items/route.ts',
  'src/app/api/admin/notifications/test/route.ts',
  'src/app/api/orders/[id]/receive/route.ts',
  'src/app/api/categories/[id]/route.ts',
  'src/app/api/orders/route.ts',
  'src/app/api/admin/orders/route.ts',
  'src/app/api/admin/reports/route.ts',
  'src/app/api/auth/refresh/route.ts',
  'src/app/api/admin/inventory/route.ts',
  'src/app/api/tables/route.ts',
  'src/app/api/notifications/[id]/route.ts',
  'src/app/api/tables/[id]/status/route.ts',
  'src/app/api/categories/route.ts',
  'src/app/api/upload/image/route.ts'
];

console.log('🔄 Iniciando atualização das importações...\n');

filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    updateImports(fullPath);
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
  }
});

console.log('\n✨ Atualização concluída!');