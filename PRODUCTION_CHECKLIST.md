# ✅ Checklist de Produção - Vercel

## 🎯 Resumo dos Arquivos Criados

- ✅ `vercel.json` - Configuração da Vercel
- ✅ `DEPLOY_GUIDE.md` - Guia completo de deploy
- ✅ `ENV_VARS_TEMPLATE.md` - Template de variáveis
- ✅ `scripts/generate-secrets.js` - Gerador de secrets
- ✅ `PRODUCTION_CHECKLIST.md` - Este arquivo

---

## 📋 Passo a Passo Rápido

### 1. Preparar Banco de Dados

- [ ] Criar conta no Supabase: https://supabase.com
- [ ] Criar novo projeto (Região: São Paulo)
- [ ] Copiar Connection String
- [ ] Salvar em local seguro

**Connection String ficará assim**:
```
postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

---

### 2. Gerar Secrets

Execute o comando:
```bash
node scripts/generate-secrets.js
```

**Você receberá**:
```
JWT_SECRET: OD0T8OxCt59qK7vr7BqSKIGsqczn0cqY5BeInB6s+k4=
NEXTAUTH_SECRET: UjxT9hcmdwLTO7Cz1qhmWfbKDgQ0ohQ+QhtRw+3YV9s=
```

- [ ] Copiar JWT_SECRET
- [ ] Copiar NEXTAUTH_SECRET
- [ ] Salvar em local seguro

---

### 3. Push para GitHub

```bash
git add .
git commit -m "Preparar para produção - Vercel"
git push origin main
```

- [ ] Código commitado
- [ ] Push realizado com sucesso

---

### 4. Deploy na Vercel

#### 4.1 Import Project

1. Acesse: https://vercel.com
2. Login com GitHub
3. **Add New** → **Project**
4. Import repositório `lanchonete-next`

- [ ] Projeto importado

#### 4.2 Configurar Variáveis

Adicione em **Environment Variables**:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | Cole a connection string do Supabase |
| `JWT_SECRET` | Cole o secret gerado |
| `NEXTAUTH_SECRET` | Cole o secret gerado |
| `NEXTAUTH_URL` | `https://seu-app.vercel.app` (temporário) |
| `NODE_ENV` | `production` |

- [ ] Todas as 5 variáveis configuradas

#### 4.3 Deploy

- [ ] Clicar em **Deploy**
- [ ] Aguardar ~2-3 minutos
- [ ] Deploy concluído ✅

---

### 5. Pós-Deploy

#### 5.1 Atualizar NEXTAUTH_URL

Após deploy, você receberá uma URL como:
```
https://lanchonete-next-abc123.vercel.app
```

1. Copiar URL real
2. Ir em **Settings** → **Environment Variables**
3. Editar `NEXTAUTH_URL`
4. Colar URL real
5. **Save**
6. Ir em **Deployments**
7. Clicar nos 3 pontos → **Redeploy**

- [ ] NEXTAUTH_URL atualizada
- [ ] Redeploy realizado

#### 5.2 Executar Migrations

**Opção A - Via Terminal Local**:
```bash
# Substitua pela sua URL real
DATABASE_URL="sua_url_producao" npx prisma migrate deploy
DATABASE_URL="sua_url_producao" npx prisma db seed
```

**Opção B - Via Supabase SQL Editor**:
1. Acesse Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute as migrations manualmente

- [ ] Migrations executadas
- [ ] Seed executado
- [ ] Tabelas criadas

#### 5.3 Testar

1. Acesse a URL: `https://sua-url.vercel.app`
2. Tente fazer login:
   - Email: `admin@lanchonete.com`
   - Senha: `admin123`

- [ ] Site carregando
- [ ] Login funcionando
- [ ] Dashboard acessível
- [ ] Criar pedido teste
- [ ] Ver relatórios

---

## 🔍 Verificações de Segurança

- [ ] `.env.local` não está no Git
- [ ] Secrets são fortes (32+ caracteres)
- [ ] HTTPS habilitado (automático na Vercel)
- [ ] NODE_ENV=production
- [ ] Headers de segurança configurados (vercel.json)

---

## 📊 Monitorar Performance

### No Vercel Dashboard:

- **Analytics**: Ver tráfego e performance
- **Logs**: Verificar erros em tempo real
- **Speed Insights**: Métricas de velocidade

- [ ] Analytics configurado
- [ ] Verificar logs
- [ ] Sem erros

---

## 💰 Custo Atual

### Setup FREE:
- Vercel Hobby: **R$ 0/mês**
- Supabase Free: **R$ 0/mês**
- Domínio .vercel.app: **R$ 0/mês**

**Total: R$ 0,00/mês** ✅

### Limites:
- Bandwidth: 100 GB/mês (Vercel)
- Database: 500 MB (Supabase)
- Storage: 1 GB (Supabase)

---

## 🚨 Problemas Comuns

### "Database connection failed"
✅ **Solução**:
- Verificar DATABASE_URL
- Verificar se migrations foram executadas
- Verificar senha do banco

### "Internal Server Error"
✅ **Solução**:
- Ver logs no Vercel Dashboard
- Verificar todas as env vars
- Verificar se código faz build local: `npm run build`

### "Not authorized"
✅ **Solução**:
- Verificar JWT_SECRET
- Verificar NEXTAUTH_SECRET
- Limpar cookies do navegador

---

## 📝 Comandos Úteis

```bash
# Gerar novos secrets
node scripts/generate-secrets.js

# Build local
npm run build

# Migrations (produção)
DATABASE_URL="url" npx prisma migrate deploy

# Seed (produção)
DATABASE_URL="url" npx prisma db seed

# Ver status das migrations
DATABASE_URL="url" npx prisma migrate status
```

---

## 🎯 Próximos Passos (Opcional)

### Domínio Personalizado
- [ ] Comprar domínio (.com.br)
- [ ] Configurar DNS na Vercel
- [ ] Atualizar NEXTAUTH_URL

### Email Transacional
- [ ] Configurar Resend.com (grátis)
- [ ] Enviar notificações de pedidos

### Monitoring Avançado
- [ ] Sentry para erros
- [ ] Google Analytics

---

## ✅ Status Final

Marque quando estiver 100% pronto:

- [ ] ✅ Banco de dados configurado
- [ ] ✅ Secrets gerados e salvos
- [ ] ✅ Deploy realizado
- [ ] ✅ NEXTAUTH_URL atualizada
- [ ] ✅ Migrations executadas
- [ ] ✅ Seed executado
- [ ] ✅ Testes realizados
- [ ] ✅ Sem erros nos logs
- [ ] ✅ Sistema funcionando 100%

---

## 🎉 Parabéns!

Seu sistema está em produção! 🚀

**URL**: https://sua-url.vercel.app

---

## 📞 Suporte

- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

