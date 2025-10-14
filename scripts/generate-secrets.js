#!/usr/bin/env node

/**
 * Script para gerar secrets seguros para produção
 * Uso: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Gerando Secrets para Produção\n');
console.log('=' .repeat(60));

// Gerar JWT_SECRET
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('\n📝 JWT_SECRET:');
console.log(jwtSecret);

// Gerar NEXTAUTH_SECRET
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('\n📝 NEXTAUTH_SECRET:');
console.log(nextAuthSecret);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Secrets gerados com sucesso!');
console.log('\n📋 Copie e cole no Vercel Dashboard:');
console.log('   Settings → Environment Variables\n');
console.log('⚠️  IMPORTANTE: Guarde esses valores em local seguro!');
console.log('   Você NÃO poderá recuperá-los depois.\n');

