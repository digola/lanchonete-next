#!/usr/bin/env node
/**
 * Script: upload-image.js
 * Objetivo: enviar uma imagem local para o bucket Supabase (images) e opcionalmente
 * atualizar o imageUrl de um produto ou categoria via API do app.
 *
 * Uso básico:
 *   node scripts/upload-image.js --file ./caminho/arquivo.jpg --type products --id 123
 *
 * Atualizar produto após upload:
 *   node scripts/upload-image.js --file ./arquivo.jpg --type products --id 123 \
 *     --update-product 123 --apiUrl http://localhost:3001 --token <JWT>
 *
 * Atualizar categoria após upload:
 *   node scripts/upload-image.js --file ./arquivo.jpg --type categories --id 456 \
 *     --update-category 456 --apiUrl http://localhost:3001 --token <JWT>
 *
 * Requisitos:
 * - SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente (.env/.env.local)
 * - Bucket "images" criado e com acesso público para leitura
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        opts[key] = true; // flag booleana
      } else {
        opts[key] = next;
        i++;
      }
    }
  }
  return opts;
}

function ensureEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no ambiente');
  }
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
}

async function uploadToSupabase({ filePath, type, resourceId, bucket = 'images', upsert = true }) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = ensureEnv();
  const filename = path.basename(filePath);
  const ext = (filename.match(/\.([a-z0-9]+)$/i)?.[1] || 'jpg').toLowerCase();
  const base = slugify(filename);
  const stamp = Date.now();
  const targetPath = `${type}/${resourceId}/${base}-${stamp}.${ext}`;

  const data = fs.readFileSync(filePath);

  const endpoint = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURI(targetPath)}`;
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': `image/${ext}`,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'x-upsert': upsert ? 'true' : 'false',
      },
      body: data,
    });
  } catch (e) {
    throw new Error(`Falha de rede ao enviar para Supabase: ${e?.message || e}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro no upload: ${res.status} ${res.statusText} - ${text}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${targetPath}`;
  return {
    ok: true,
    bucket,
    path: targetPath,
    url: publicUrl,
    sizeKb: Math.round(data.length / 1024),
  };
}

async function updateEntityImage({ apiUrl, token, productId, categoryId, imageUrl }) {
  if (!apiUrl || !token) {
    console.warn('Aviso: apiUrl e token são necessários para atualizar o programa. Pulando etapa de atualização.');
    return null;
  }
  let endpoint = '';
  const payload = { imageUrl };
  if (productId) {
    endpoint = `${apiUrl}/api/products/${productId}`;
  } else if (categoryId) {
    endpoint = `${apiUrl}/api/categories/${categoryId}`;
  } else {
    console.warn('Aviso: Nenhum productId ou categoryId fornecido. Pulando atualização.');
    return null;
  }

  let res;
  try {
    res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw new Error(`Falha de rede ao atualizar entidade: ${e?.message || e}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ao atualizar entidade: ${res.status} ${res.statusText} - ${text}`);
  }
  const json = await res.json();
  return json;
}

(async () => {
  try {
    const opts = parseArgs();
    const filePath = opts.file;
    const type = opts.type || 'products';
    const resourceId = opts.id || 'general';

    if (!filePath) {
      console.error('Uso: node scripts/upload-image.js --file <caminho/imagem> [--type products|categories] [--id <resourceId>]');
      process.exit(1);
    }

    // 1) Upload para Supabase
    const result = await uploadToSupabase({ filePath, type, resourceId });
    console.log('Upload realizado com sucesso:', result);

    // 2) Atualizar programa (opcional)
    const apiUrl = opts.apiUrl || 'http://localhost:3001';
    const token = opts.token; // JWT do admin/manager
    const productId = opts['update-product'];
    const categoryId = opts['update-category'];

    if (productId || categoryId) {
      try {
        const updated = await updateEntityImage({ apiUrl, token, productId, categoryId, imageUrl: result.url });
        if (updated) {
          console.log('Atualização da entidade realizada com sucesso:', updated);
        }
      } catch (e) {
        console.error('Falha ao atualizar entidade:', e.message || e);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Erro:', e.message || e);
    process.exit(1);
  }
})();