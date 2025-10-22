// Cria um bucket no Supabase Storage usando SUPABASE_SERVICE_ROLE_KEY
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  if (fs.existsSync(envLocalPath)) envContent = fs.readFileSync(envLocalPath, 'utf8');
  else if (fs.existsSync(envPath)) envContent = fs.readFileSync(envPath, 'utf8');
  const keys = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
  for (const key of keys) {
    const regex = new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm');
    const match = envContent.match(regex);
    if (match) {
      let val = match[1].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  }
}

async function createBucket(name, isPublic = true, fileSizeLimit = null, allowedMimeTypes = null) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados nas variáveis de ambiente.');
  }

  const endpoint = `${url}/storage/v1/bucket`;
  const body = { name, public: !!isPublic };
  if (fileSizeLimit) body.file_size_limit = fileSizeLimit; // ex: '50MB'
  if (allowedMimeTypes && Array.isArray(allowedMimeTypes)) body.allowed_mime_types = allowedMimeTypes;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    throw new Error(`Falha ao criar bucket: ${res.status} ${res.statusText} - ${text}`);
  }
  return data;
}

(async () => {
  loadEnv();
  const [bucketNameArg, publicArg] = process.argv.slice(2);
  const bucketName = bucketNameArg || 'images';
  const isPublic = publicArg ? publicArg.toLowerCase() !== 'false' : true; // padrão: público
  try {
    const result = await createBucket(bucketName, isPublic);
    console.log('Bucket criado com sucesso:', result);
    console.log(`Nome: ${bucketName} | Público: ${isPublic}`);
    console.log('Dica: Uploads públicos podem ser acessados via URL:');
    console.log(`${process.env.SUPABASE_URL.replace('/rest/v1','')}/storage/v1/object/public/${bucketName}/<path-do-arquivo>`);
  } catch (err) {
    console.error('Erro ao criar bucket:', err.message || err);
    process.exit(1);
  }
})();