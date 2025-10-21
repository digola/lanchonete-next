import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';
import { createLogger, getOrCreateRequestId, withRequestIdHeader } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// Helpers de env
function parseAllowedTypes(): string[] {
  const raw = process.env.UPLOAD_ALLOWED_TYPES;
  if (raw && raw.trim().length > 0) {
    return raw.split(',').map((t) => t.trim());
  }
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
}

function parseMaxSize(): number {
  const raw = process.env.UPLOAD_MAX_SIZE;
  if (raw && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  // default 10MB
  return 10 * 1024 * 1024;
}

function resolveUploadDir(): string {
  const base = process.env.UPLOAD_DIR;
  if (base && base.trim().length > 0) {
    return base;
  }
  return join(process.cwd(), 'public', 'uploads', 'images');
}

function resolveFileExtension(mime: string, originalName?: string): string {
  // map MIME types to standard extensions
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  // fallback to original extension if exists
  const ext = originalName?.split('.').pop();
  return ext ? ext : 'bin';
}

function parseRateLimitConfig() {
  const max = Number(process.env.RATE_LIMIT_UPLOAD_IMAGE_MAX ?? 20);
  const windowMs = Number(process.env.RATE_LIMIT_UPLOAD_IMAGE_WINDOW_MS ?? 60_000);
  return { max, windowMs };
}

function getSupabaseAdminClient(): SupabaseClient<any, any, any, any, any> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  }) as unknown as SupabaseClient<any, any, any, any, any>;
}

function getBucketName(): string {
  return process.env.SUPABASE_BUCKET_IMAGES || 'images';
}

async function ensureBucketExists(supabase: SupabaseClient<any, any, any, any, any>, bucket: string) {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      return false;
    }
    const exists = (buckets || []).some((b) => b.name === bucket);
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket(bucket, { public: true });
      if (createErr) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger('api.upload.image', requestId);
  const json = (payload: any, status: number) => {
    const res = NextResponse.json(payload, { status });
    return withRequestIdHeader(res, requestId);
  };
  try {
    // Rate limiting (simples, in-memory)
    const { max, windowMs } = parseRateLimitConfig();
    const clientIp = getClientIp(request);
    const key = `${clientIp}:upload_image`;
    const rl = checkRateLimit(key, windowMs, max);
    if (!rl.allowed) {
      log.warn('Rate limit exceeded', { clientIp, remaining: rl.remaining, resetInMs: rl.resetInMs, max });
      const tooMany = json(
        { success: false, error: 'Muitas requisições. Tente novamente em alguns segundos.' },
        429
      );
      tooMany.headers.set('Retry-After', String(Math.ceil(rl.resetInMs / 1000)));
      tooMany.headers.set('X-RateLimit-Limit', String(max));
      tooMany.headers.set('X-RateLimit-Remaining', String(rl.remaining));
      tooMany.headers.set('X-RateLimit-Reset', String(rl.resetInMs));
      return tooMany;
    }

    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      log.warn('Missing auth token');
      return json(
        { success: false, error: 'Token de autenticação não fornecido' },
        401
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      log.warn('Invalid or expired token');
      return json(
        { success: false, error: 'Token inválido ou expirado' },
        401
      );
    }

    // Verificar permissão (apenas admin e funcionário podem fazer upload)
    if (!hasPermission(decoded.role, 'upload_images')) {
      log.warn('Permission denied for upload', { role: decoded.role });
      return json(
        { success: false, error: 'Sem permissão para fazer upload de imagens' },
        403
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      log.warn('No file provided');
      return json(
        { success: false, error: 'Nenhuma imagem foi enviada' },
        400
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = parseAllowedTypes();
    if (!allowedTypes.includes(file.type)) {
      log.warn('Unsupported file type', { type: file.type });
      return json(
        { success: false, error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP' },
        400
      );
    }

    // Validar tamanho (env OU padrão 10MB)
    const maxSize = parseMaxSize();
    if (file.size > maxSize) {
      log.warn('File too large', { size: file.size, maxSize });
      return json(
        { success: false, error: `Arquivo muito grande. Máximo ${(maxSize / (1024 * 1024)).toFixed(0)}MB` },
        400
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = resolveFileExtension(file.type, file.name);
    const fileName = `${timestamp}_${randomString}.${extension}`;

    // Salvar arquivo em armazenamento persistente (Supabase Storage) se disponível
    const supabase = getSupabaseAdminClient();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (supabase) {
      const bucket = getBucketName();
      const objectPath = fileName;
      const okBucket = await ensureBucketExists(supabase, bucket);
      if (!okBucket) {
        log.warn('Bucket check/create failed; falling back to filesystem', { bucket });
      } else {
        const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
          contentType: file.type,
          upsert: false,
        });
        if (!uploadError) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
          const imageUrl = data.publicUrl;
          log.info('Upload success (Supabase Storage)', { fileName, size: file.size, type: file.type, bucket });
          const ok = json(
            {
              success: true,
              data: {
                url: imageUrl,
                fileName: fileName,
                size: file.size,
                type: file.type,
                storage: 'supabase',
                bucket,
              },
            },
            200
          );
          ok.headers.set('X-RateLimit-Limit', String(max));
          ok.headers.set('X-RateLimit-Remaining', String(rl.remaining));
          ok.headers.set('X-RateLimit-Reset', String(rl.resetInMs));
          return ok;
        } else {
          log.warn('Supabase upload failed, falling back to filesystem', { error: uploadError.message });
        }
      }
    }

    // Fallback: salvar em filesystem local (para dev/testes)
    // Criar diretório se não existir
    const uploadDir = resolveUploadDir();
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Diretório já existe ou não pode ser criado
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Retornar URL da imagem (suporte a UPLOAD_BASE_URL)
    const baseUrl = process.env.UPLOAD_BASE_URL;
    const imageUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/${fileName}`
      : `/uploads/images/${fileName}`;

    log.info('Upload success (filesystem)', { fileName, size: file.size, type: file.type });
    const ok = json(
      {
        success: true,
        data: {
          url: imageUrl,
          fileName: fileName,
          size: file.size,
          type: file.type,
          storage: 'filesystem',
        },
      },
      200
    );
    ok.headers.set('X-RateLimit-Limit', String(max));
    ok.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    ok.headers.set('X-RateLimit-Reset', String(rl.resetInMs));
    return ok;
  } catch (error) {
    log.error('Unhandled error during upload', { error: error instanceof Error ? error.message : String(error) });
    const res = NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
    return withRequestIdHeader(res, requestId);
  }
}
