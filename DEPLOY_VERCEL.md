# Deploy no Vercel - Sistema Lanchonete

## 🚀 Configuração Completa para Deploy

### 1. **Preparação do Projeto**

O projeto já está configurado com:
- ✅ `vercel.json` otimizado
- ✅ Scripts de build para Vercel
- ✅ Configurações do Next.js para produção
- ✅ Variáveis de ambiente de exemplo

### 2. **Configuração do Banco de Dados**

#### **Opção A: Supabase (Recomendado - 100% Gratuito)**

1. **Criar conta no Supabase:**
   - Acesse: https://supabase.com
   - Crie uma conta gratuita
   - Crie um novo projeto

2. **Configurar banco:**
   ```sql
   -- O Supabase criará automaticamente um PostgreSQL
   -- Anote a URL de conexão fornecida
   ```

3. **Obter URLs de conexão:**
   - Vá em `Settings > Database`
   - Copie a `Connection String` (DATABASE_URL)
   - Copie a `Direct Connection` (DIRECT_URL)

#### **Opção B: PlanetScale**

1. **Criar conta no PlanetScale:**
   - Acesse: https://planetscale.com
   - Crie uma conta gratuita
   - Crie um novo banco MySQL

2. **Configurar conexão:**
   - Obtenha a string de conexão
   - Configure como DATABASE_URL

### 3. **Deploy no Vercel**

#### **Método 1: Via Dashboard (Recomendado)**

1. **Conectar repositório:**
   - Acesse: https://vercel.com
   - Clique em "New Project"
   - Conecte seu repositório GitHub
   - Selecione o branch `develop`

2. **Configurar variáveis de ambiente:**
   ```env
   NODE_ENV=production
   DATABASE_URL=sua_url_do_supabase_aqui
   DIRECT_URL=sua_direct_url_do_supabase_aqui
   JWT_SECRET=seu_jwt_secret_super_seguro
   JWT_REFRESH_SECRET=seu_refresh_secret_super_seguro
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   UPLOAD_MAX_SIZE=10485760
   UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
   UPLOAD_DIR=/tmp/uploads/images
   UPLOAD_BASE_URL=https://seu-app.vercel.app/uploads/images
   APP_NAME=Sistema Lanchonete
   NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
   NEXT_TELEMETRY_DISABLED=1
   PRISMA_GENERATE_DATAPROXY=true
   ```

3. **Configurações de build:**
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
   - Install Command: `npm install`

#### **Método 2: Via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### 4. **Configuração Pós-Deploy**

#### **Executar Migrações do Banco:**

1. **Via Vercel CLI:**
   ```bash
   # Conectar ao projeto
   vercel link

   # Executar migrações
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

2. **Via Supabase Dashboard:**
   - Acesse o SQL Editor no Supabase
   - Execute as migrações manualmente se necessário

#### **Testar Funcionalidades:**

1. **Criar usuário admin:**
   ```bash
   # Usar o script fornecido
   node scripts/create-admin-user.js
   ```

2. **Verificar endpoints:**
   - `/api/health` - Health check
   - `/api/auth/login` - Login
   - `/api/products` - Produtos
   - `/api/orders` - Pedidos

### 5. **Domínio Personalizado (Opcional)**

1. **No dashboard do Vercel:**
   - Vá em `Settings > Domains`
   - Adicione seu domínio
   - Configure DNS conforme instruções

2. **Atualizar variáveis:**
   ```env
   NEXT_PUBLIC_APP_URL=https://seudominio.com
   UPLOAD_BASE_URL=https://seudominio.com/uploads/images
   ```

### 6. **Monitoramento e Logs**

- **Logs em tempo real:** `vercel logs`
- **Analytics:** Dashboard do Vercel
- **Performance:** Vercel Speed Insights
- **Erros:** Vercel Error Tracking

### 7. **Troubleshooting**

#### **Problemas Comuns:**

1. **Erro de build:**
   ```bash
   # Verificar localmente
   npm run build
   ```

2. **Erro de banco:**
   - Verificar URLs de conexão
   - Testar conexão local
   - Verificar migrações

3. **Erro de uploads:**
   - Verificar configurações de CORS
   - Usar Cloudinary para produção

#### **Comandos Úteis:**

```bash
# Verificar status do deploy
vercel ls

# Ver logs
vercel logs [deployment-url]

# Executar função localmente
vercel dev

# Remover deployment
vercel rm [deployment-name]
```

### 8. **Custos e Limites**

#### **Vercel (Hobby Plan - Gratuito):**
- ✅ 100GB bandwidth/mês
- ✅ 1000 deployments/mês
- ✅ Domínios ilimitados
- ✅ SSL automático
- ❌ Sem edge functions comerciais

#### **Supabase (Free Tier):**
- ✅ 500MB database
- ✅ 2GB bandwidth/mês
- ✅ 50MB file storage
- ✅ 50,000 monthly active users

### 9. **Próximos Passos**

1. **Configurar CI/CD:** Deploy automático via GitHub
2. **Monitoramento:** Configurar alertas
3. **Backup:** Configurar backup automático do banco
4. **CDN:** Configurar Cloudinary para imagens
5. **Analytics:** Configurar Google Analytics

---

## 🎯 **Resumo Rápido**

1. **Criar conta Supabase** → Obter URLs do banco
2. **Deploy no Vercel** → Conectar GitHub
3. **Configurar variáveis** → Colar URLs e secrets
4. **Executar migrações** → `prisma migrate deploy`
5. **Testar aplicação** → Criar usuário admin

**Tempo estimado:** 15-30 minutos

**Custo:** R$ 0,00 (100% gratuito)