# Deploy no Google Cloud — Demo Rápido (Cloud Run + Docker)

Este guia descreve um deploy de demonstração inicial do projeto Next.js usando Docker e Cloud Run com banco SQLite efêmero. Não recomendado para produção. Após validação, migre para produção (Cloud Run + Cloud SQL) conforme documentação dedicada.

## 1. Visão geral
- Container com Node 20 (Debian slim), Next.js compilado e Prisma Client.
- Na inicialização: `prisma db push` + `npm run db:seed` criam e populam `prisma/dev.db` (SQLite) dentro do container.
- O filesystem do Cloud Run é efêmero; dados serão perdidos em atualizações/escala. Use apenas para DEMO.

## 2. Requisitos
- Docker instalado.
- Google Cloud SDK (gcloud): `gcloud auth login` e `gcloud config set project <PROJECT_ID>`.
- APIs ativas:
  - `gcloud services enable run.googleapis.com artifactregistry.googleapis.com`

## 3. Teste local com Docker (opcional, recomendado)
1. Build da imagem local:
   - `docker build -t lanchonete-next:demo .`
2. Executar container:
   - `docker run --rm -p 3000:3000 -e JWT_SECRET=uma_chave_forte -e JWT_REFRESH_SECRET=outra_chave lanchonete-next:demo`
3. Validar:
   - Acesse `http://localhost:3000`
   - Login em `/login` com usuários do seed (admin/funcionário/cliente conforme README)
   - APIs: `GET /api/categories`, `GET /api/products`, etc.

## 4. Publicar imagem no Artifact Registry
1. Autenticar Docker no Artifact Registry da região (ex.: `us-central1`):
   - `gcloud auth configure-docker us-central1-docker.pkg.dev`
2. Criar repositório de imagens (uma vez):
   - `gcloud artifacts repositories create web --repository-format=docker --location=us-central1`
3. Build com tag do Registry e push:
   - `docker build -t us-central1-docker.pkg.dev/<PROJECT_ID>/web/lanchonete-next:demo .`
   - `docker push us-central1-docker.pkg.dev/<PROJECT_ID>/web/lanchonete-next:demo`

## 5. Deploy no Cloud Run (DEMO)
- `gcloud run deploy lanchonete-next-demo \
  --image us-central1-docker.pkg.dev/<PROJECT_ID>/web/lanchonete-next:demo \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000`

### Variáveis de ambiente (recomendado)
- JWT:
  - `gcloud run services update lanchonete-next-demo --region us-central1 --update-env-vars JWT_SECRET=uma_chave_forte,JWT_REFRESH_SECRET=outra_chave`

## 6. Verificações pós-deploy
- Abra a URL pública do Cloud Run e valide:
  - Página inicial `/` carrega
  - Fluxo de login `/login` funciona
  - APIs básicas respondem (ex.: `/api/categories`)
- Logs (para investigar):
  - `gcloud logs read --project=<PROJECT_ID> --limit=100 --freshness=1h`

## 7. Limitações do DEMO e próximos passos
- SQLite é efêmero em Cloud Run e não suporta múltiplas instâncias com consistência.
- Migre para produção (Cloud SQL + Postgres) seguindo `DEPLOY_GOOGLE_CLOUD_PRODUCAO.md`.

---
Dúvidas? Veja também o README atualizado para credenciais do seed e scripts úteis.