/**
 * Script de Análise Estática
 * Procura por erros comuns na arquitetura
 */

import * as fs from 'fs';
import * as path from 'path';

interface Issue {
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

class StaticAnalyzer {
  private issues: Issue[] = [];
  private srcRoot: string;

  constructor(srcRoot: string) {
    this.srcRoot = srcRoot;
  }

  log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warn: '\x1b[33m',
      reset: '\x1b[0m',
    };
    console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
  }

  addIssue(issue: Issue) {
    this.issues.push(issue);
  }

  private readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  private getFiles(dir: string, ext: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...this.getFiles(fullPath, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  // Verificar imports não utilizados
  checkUnusedImports() {
    this.log('\n🔍 Verificando imports não utilizados...', 'info');
    
    const files = this.getFiles(this.srcRoot, '.tsx').concat(this.getFiles(this.srcRoot, '.ts'));
    let checked = 0;

    for (const file of files) {
      if (file.includes('node_modules') || file.includes('.next')) continue;

      const content = this.readFile(file);
      const importMatches = content.match(/^import\s+.*?from\s+['"][^'"]+['"]/gm) || [];
      
      for (const importLine of importMatches) {
        const match = importLine.match(/import\s+({.*?}|.*?)\s+from/);
        if (!match) continue;

        const imported = (match[1] ?? '').trim();
        const names = imported
          .replace(/[{}]/g, '')
          .split(',')
          .map(n => n.trim().split(' as ')[0])
          .filter(n => n && n !== '*');

        for (const name of names) {
          if (name && !content.includes(name.replace(/\s/g, ''))) {
            const line = content.split('\n').findIndex(l => l.includes(importLine)) + 1;
            this.addIssue({
              file: path.relative(this.srcRoot, file),
              line,
              severity: 'warning',
              message: `Import não utilizado: "${name}"`,
              suggestion: `Remova o import ou utilize a variável ${name}`,
            });
          }
        }
      }
      checked++;
    }

    this.log(`✅ Verificados ${checked} arquivos`, 'info');
  }

  // Verificar erros de tipagem
  checkTypingErrors() {
    this.log('\n🔍 Verificando erros de tipagem...', 'info');

    const files = this.getFiles(this.srcRoot, '.tsx').concat(this.getFiles(this.srcRoot, '.ts'));
    let issues = 0;

    for (const file of files) {
      const content = this.readFile(file);
      const line = path.relative(this.srcRoot, file);

      // Procurar por 'any' types
      if (content.includes(': any') || content.includes('<any>')) {
        const lineNum = content.split('\n').findIndex(l => l.includes('any')) + 1;
        this.addIssue({
          file: line,
          line: lineNum,
          severity: 'warning',
          message: 'Uso de "any" type detectado',
          suggestion: 'Use tipos específicos em vez de "any" para melhor type safety',
        });
        issues++;
      }

      // Procurar por 'TODO' ou 'FIXME' comentários
      const todoMatches = content.match(/\/\/\s*(TODO|FIXME):\s*(.+)/g) || [];
      for (const match of todoMatches) {
        const lineNum = content.split('\n').findIndex(l => l.includes(match)) + 1;
        this.addIssue({
          file: line,
          line: lineNum,
          severity: 'info',
          message: match.replace('//', '').trim(),
          suggestion: 'Verificar e completar o TODO/FIXME',
        });
      }
    }

    this.log(`✅ ${issues} potenciais problemas de tipagem encontrados`, 'info');
  }

  // Verificar handles de erro
  checkErrorHandling() {
    this.log('\n🔍 Verificando tratamento de erros...', 'info');

    const files = this.getFiles(this.srcRoot, '.tsx').concat(this.getFiles(this.srcRoot, '.ts'));
    let missing = 0;

    for (const file of files) {
      const content = this.readFile(file);
      const line = path.relative(this.srcRoot, file);

      // Procurar por try sem catch
      const tryBlocks = content.match(/try\s*{[\s\S]*?}\s*catch/g) || [];
      if (content.includes('try') && tryBlocks.length === 0 && content.includes('fetch')) {
        this.addIssue({
          file: line,
          severity: 'warning',
          message: 'Possível falta de tratamento de erro com try/catch',
          suggestion: 'Adicione tratamento de erro apropriado para operações assíncronas',
        });
        missing++;
      }
    }

    this.log(`✅ Verificação de erros concluída (${missing} problemas)`, 'info');
  }

  // Verificar hooks rules
  checkHooksRules() {
    this.log('\n🔍 Verificando React Hooks Rules...', 'info');

    const files = this.getFiles(this.srcRoot, '.tsx');
    let issues = 0;

    for (const file of files) {
      const content = this.readFile(file);
      const line = path.relative(this.srcRoot, file);

      // Procurar por hooks dentro de conditionals
      if ((content.includes('if') || content.includes('for')) && 
          (content.includes('useState') || content.includes('useEffect'))) {
        const lineNum = content.split('\n').findIndex(l => 
          (l.includes('if') || l.includes('for')) && 
          (content.substring(content.indexOf(l)).includes('useState') || 
           content.substring(content.indexOf(l)).includes('useEffect'))
        ) + 1;
        
        if (lineNum > 0) {
          this.addIssue({
            file: line,
            line: lineNum,
            severity: 'error',
            message: 'Hook chamado dentro de condicional (viola rules of hooks)',
            suggestion: 'Mova hooks para o nível superior do componente',
          });
          issues++;
        }
      }
    }

    this.log(`✅ Verificação de hooks concluída (${issues} problemas)`, 'info');
  }

  // Verificar API routes
  checkApiRoutes() {
    this.log('\n🔍 Verificando API routes...', 'info');

    const apiDir = path.join(this.srcRoot, 'app', 'api');
    const files = this.getFiles(apiDir, '.ts').concat(this.getFiles(apiDir, '.tsx'));
    let validated = 0;

    for (const file of files) {
      const content = this.readFile(file);
      const relPath = path.relative(this.srcRoot, file);

      // Verificar se tem export de função HTTP
      const hasExport = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g.test(content);
      if (!hasExport) {
        this.addIssue({
          file: relPath,
          severity: 'warning',
          message: 'Arquivo de API sem exports de função HTTP detectado',
          suggestion: 'Adicione exports async para GET, POST, etc',
        });
      }

      // Verificar error handling
      if (content.includes('async function') && !content.includes('try') && !content.includes('catch')) {
        this.addIssue({
          file: relPath,
          severity: 'warning',
          message: 'Função assíncrona sem tratamento de erro detectada',
          suggestion: 'Adicione try/catch para tratamento robusto de erros',
        });
      }

      validated++;
    }

    this.log(`✅ Validadas ${validated} rotas de API`, 'info');
  }

  // Verificar middleware
  checkMiddleware() {
    this.log('\n🔍 Verificando middleware.ts...', 'info');

    const middlewareFile = path.join(this.srcRoot, 'middleware.ts');
    if (!fs.existsSync(middlewareFile)) {
      this.addIssue({
        file: 'middleware.ts',
        severity: 'warning',
        message: 'Arquivo middleware.ts não encontrado',
        suggestion: 'Crie middleware.ts na raiz de src/ se precisar de autenticação',
      });
    }
  }

  // Verificar tipos de banco de dados
  checkDatabaseTypes() {
    this.log('\n🔍 Verificando tipos de banco de dados...', 'info');

    const typesFile = path.join(this.srcRoot, 'types', 'index.ts');
    if (fs.existsSync(typesFile)) {
      const content = this.readFile(typesFile);

      // Verificar se todos os tipos do Prisma estão exportados
      const requiredTypes = ['User', 'Product', 'Order', 'Table', 'Category', 'OrderItem'];
      for (const type of requiredTypes) {
        if (!content.includes(`interface ${type}`) && !content.includes(`type ${type}`)) {
          this.addIssue({
            file: 'types/index.ts',
            severity: 'warning',
            message: `Tipo "${type}" não encontrado em types/index.ts`,
            suggestion: `Adicione a interface ${type} em types/index.ts`,
          });
        }
      }
    }

    this.log('✅ Tipos de banco de dados verificados', 'info');
  }

  // Verificar configurações de build
  checkBuildConfig() {
    this.log('\n🔍 Verificando configurações de build...', 'info');

    const files = [
      path.join(this.srcRoot, '..', 'tsconfig.json'),
      path.join(this.srcRoot, '..', 'next.config.js'),
      path.join(this.srcRoot, '..', 'tailwind.config.ts'),
    ];

    for (const file of files) {
      const name = path.basename(file);
      if (!fs.existsSync(file)) {
        this.addIssue({
          file: name,
          severity: 'error',
          message: `Arquivo de configuração "${name}" não encontrado`,
          suggestion: `Crie ou restaure o arquivo ${name}`,
        });
      }
    }

    this.log('✅ Configurações de build verificadas', 'info');
  }

  // Resumo
  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('📊 RESUMO DA ANÁLISE ESTÁTICA', 'info');
    this.log('='.repeat(60), 'info');

    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const infos = this.issues.filter(i => i.severity === 'info');

    this.log(`❌ Erros: ${errors.length}`, errors.length > 0 ? 'error' : 'info');
    this.log(`⚠️  Avisos: ${warnings.length}`, warnings.length > 0 ? 'warn' : 'info');
    this.log(`ℹ️  Informações: ${infos.length}`, 'info');

      if (this.issues.length > 0) {
        this.log('\n📝 DETALHES DOS PROBLEMAS:', 'info');
        for (const issue of this.issues.slice(0, 20)) {
          const severity = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          const logType: 'info' | 'success' | 'error' | 'warn' = issue.severity === 'warning' ? 'warn' : issue.severity;
          this.log(
            `${severity} ${issue.file}${issue.line ? `:${issue.line}` : ''}\n   ${issue.message}\n   💡 ${issue.suggestion}`,
            logType
          );
        }

      if (this.issues.length > 20) {
        this.log(`\n... e mais ${this.issues.length - 20} problemas`, 'info');
      }
    }

    this.log('\n' + '='.repeat(60), 'info');
  }

  async runAll() {
    this.log('🚀 Iniciando Análise Estática...', 'info');
    this.log(`Diretório: ${this.srcRoot}`, 'info');

    this.checkUnusedImports();
    this.checkTypingErrors();
    this.checkErrorHandling();
    this.checkHooksRules();
    this.checkApiRoutes();
    this.checkMiddleware();
    this.checkDatabaseTypes();
    this.checkBuildConfig();

    this.printSummary();

    // Exit com código apropriado
    const errors = this.issues.filter(i => i.severity === 'error').length;
    process.exit(errors > 0 ? 1 : 0);
  }
}

// Executar
const srcRoot = process.argv[2] || path.join(__dirname, '..', 'src');
const analyzer = new StaticAnalyzer(srcRoot);
analyzer.runAll().catch(error => {
  console.error('❌ Erro crítico:', error);
  process.exit(1);
});
