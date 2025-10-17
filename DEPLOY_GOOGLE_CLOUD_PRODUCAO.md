# Deploy em Produção — Google Cloud (Cloud Run + Cloud SQL + Prisma)

Este guia descreve o processo recomendado para produção: Cloud Run executando a aplicação e Cloud SQL (PostgreSQL) para persistência de dados. Requer migrations versionadas e configuração adequada de `DATABASE_URL`.

## 1. Por que Cloud SQL?
- Persistência confiável e escalável para múltiplas instâncias do Cloud Run.
- Evita problemas do filesystem efêmero do Cloud Run.

## 2. Pré-requisitos
- Google Cloud SDK (gcloud) instalado e projeto ativo:
  - `gcloud auth login`
  - `gcloud config set project <PROJECT_ID>`
- APIs: `run.googleapis.com`, `artifactregistry.googleapis.com`, `sqladmin.googleapis.com`
- Migrations Prisma versionadas em `prisma/migrations` (geradas com `npx prisma migrate dev`).

## 3. Criar instância Cloud SQL (PostgreSQL)
1. Criar instância (ex.: região `us-central1`):
   - `gcloud sql instances create minha-sql --database-version=POSTGRES_14 --region=us-central1`
2. Criar banco e usuário:
   - `gcloud sql databases create lanchonete --instance=minha-sql`
   - `gcloud sql users create app_user --instance=minha-sql --password "uma_senha_forte"`
3. Obter o nome de conexão (INSTANCE_CONNECTION_NAME):
   - `gcloud sql instances describe minha-sql --format="value(connectionName)"`
   - Ex.: `<PROJECT_ID>:us-central1:minha-sql`

## 4. Preparar o schema do Prisma para PostgreSQL
- Ajuste `prisma/schema.prisma` para `provider = "postgresql"` e `datasource` com `DATABASE_URL`.
- Gere e aplique migrations (localmente com Postgres ou via Cloud SQL Proxy):
  - Defina `DATABASE_URL=postgresql://app_user:SENHA@localhost:5432/lanchonete`
  - `npx prisma migrate dev`
- Confirme que o `prisma/seed.ts` funciona com Postgres (se for necessário rodar seed em ambientes específicos).

## 5. Atualizar Dockerfile para produção
- Na branch `deploy-gcloud-prod` o `Dockerfile` já está ajustado para produção:
  - No startup: `npx prisma migrate deploy && npm run start`
  - Remove o seed automático no startup (evitar repopular dados em produção).

## 6. Build e publicação da imagem (Artifact Registry)
1. Autenticar Docker na região:
   - `gcloud auth configure-docker us-central1-docker.pkg.dev`
2. Criar repositório (uma vez):
   - `gcloud artifacts repositories create web --repository-format=docker --location=us-central1`
3. Build e push da imagem de produção:
   - `docker build -t us-central1-docker.pkg.dev/<PROJECT_ID>/web/lanchonete-next:prod .`
   - `docker push us-central1-docker.pkg.dev/<PROJECT_ID>/web/lanchonete-next:prod`

## 7. Deploy no Cloud Run (produção)
- Conectar a instância Cloud SQL e configurar variáveis:
```
gcloud run deploy lanchonete-next \
  --image us-central1-docker.pkg.dev/<PROJECT_ID>/web/lanchonete-next:prod \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --add-cloudsql-instances <PROJECT_ID>:us-central1:minha-sql \
  --update-env-vars DATABASE_URL="postgresql://app_user:SENHA@localhost:5432/lanchonete?host=/cloudsql/<PROJECT_ID>:us-central1:minha-sql",JWT_SECRET=uma_chave_forte,JWT_REFRESH_SECRET=outra_chave
```

## 8. Verificações pós-deploy
- Acesse a URL do serviço Cloud Run.
- Teste rotas principais: `/`, `/login`, `/api/categories`.
- Cheque logs e erros:
  - `gcloud logs read --project=<PROJECT_ID> --limit=100 --freshness=1h`
- Se houver erro de migração/DB, valide `DATABASE_URL` e permissões do `app_user`.

## 9. Notas de operação
- Migrations: use `migrate deploy` em produção (não `db push`).
- Seed: rode apenas sob necessidade controlada (ex.: ambiente de staging) para evitar dados inconsistentes.
- Segurança: mantenha segredos em variáveis de ambiente; considere Cloud Secret Manager.
- Escala: Cloud Run escala horizontalmente; o banco deve suportar conexões (considere pgbouncer/conexões limitadas).

---
Para dúvidas, consulte também o README e `DEPLOY_GOOGLE_CLOUD_DEMO.md` para a transição de demo → produção.