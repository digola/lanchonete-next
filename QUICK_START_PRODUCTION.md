# ⚡ Quick Start - Deploy em Produção

## 🎯 TL;DR - Passo a Passo Rápido

### 1. Banco de Dados (2 min)
```
1. https://supabase.com → Sign Up
2. New Project → Name: lanchonete-db
3. Region: South America (São Paulo)
4. Password: [CRIAR SENHA FORTE]
5. Copiar: Settings → Database → Connection String (URI)
```

### 2. Secrets (30 seg)
```bash
node scripts/generate-secrets.js
# Copiar os 2 secrets gerados
```

### 3. GitHub (1 min)
```bash
git add .
git commit -m "feat: deploy para produção"
git push origin main
```

### 4. Vercel (3 min)
```
1. https://vercel.com → Login com GitHub
2. Import → Selecione seu repo
3. Environment Variables → Adicionar 5 variáveis (ver abaixo)
4. Deploy!
```

### 5. Pós-Deploy (2 min)
```
1. Copiar URL do deploy
2. Atualizar NEXTAUTH_URL na Vercel
3. Redeploy
4. Testar: https://sua-url.vercel.app
```

---

## 📝 Variáveis de Ambiente (5 variáveis)

```env
DATABASE_URL = [Cole do Supabase]
JWT_SECRET = [Cole do script]
NEXTAUTH_SECRET = [Cole do script]  
NEXTAUTH_URL = https://seu-app.vercel.app
NODE_ENV = production
```

---

## ✅ Verificação Rápida

### Após Deploy
```bash
# 1. Site carrega?
https://sua-url.vercel.app ✓

# 2. Login funciona?
admin@lanchonete.com / admin123 ✓

# 3. Sem erros?
Vercel → Logs → Sem erros ✓
```

---

## 🚨 Troubleshooting Rápido

### "Database connection failed"
```bash
# Verificar DATABASE_URL
# Verificar senha do Supabase
# Rodar migrations:
DATABASE_URL="sua_url" npx prisma migrate deploy
```

### "Internal Server Error"
```bash
# Ver logs no Vercel Dashboard
# Verificar todas as 5 env vars
# Testar build local:
npm run build
```

### "Not authorized"
```bash
# Verificar JWT_SECRET e NEXTAUTH_SECRET
# Limpar cookies do navegador
# Verificar NEXTAUTH_URL
```

---

## 📊 Custos

### Setup Atual
- Vercel Hobby: **R$ 0**
- Supabase Free: **R$ 0**
- **Total: R$ 0/mês** ✅

### Limites
- 100 GB bandwidth (Vercel)
- 500 MB database (Supabase)
- Suficiente para 1000+ pedidos/mês

---

## 📚 Documentação Completa

- `DEPLOY_GUIDE.md` - Guia detalhado
- `PRODUCTION_CHECKLIST.md` - Checklist completo
- `ENV_VARS_TEMPLATE.md` - Template de variáveis
- `PRODUCTION_OPTIMIZATIONS.md` - Otimizações aplicadas

---

## 🎉 Deploy Completo!

Tempo total: **~10 minutos**

URL do sistema: https://sua-url.vercel.app

Login padrão:
- Email: `admin@lanchonete.com`
- Senha: `admin123`

**⚠️ IMPORTANTE**: Troque a senha do admin após primeiro login!

---

## 💡 Próximos Passos (Opcional)

1. **Domínio próprio** (.com.br)
2. **Email transacional** (Resend)
3. **Monitoring** (Sentry)
4. **Analytics** (Google Analytics)

---

✨ **Sistema em produção e funcionando!** 🚀

