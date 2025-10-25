import { uploadBinary, getPublicUrl } from '@/lib/storage';

export const runtime = 'nodejs';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const BUCKET = 'images';

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'Arquivo "file" é obrigatório' }), { status: 400 });
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      return new Response(JSON.stringify({ error: `MIME não permitido: ${file.type}` }), { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return new Response(JSON.stringify({ error: `Arquivo excede ${MAX_SIZE_BYTES / (1024*1024)}MB` }), { status: 400 });
    }

    const type = (formData.get('type') as string) || 'products';
    const resourceId = (formData.get('id') as string) || 'general';
    const originalName = ((formData.get('filename') as string) || file.name || 'upload').trim();

    const baseSlug = slugify(originalName);
    const stamp = Date.now();

    const buffer = Buffer.from(await file.arrayBuffer());

    // Import dinâmico reduz o peso do bundle e carrega o Sharp apenas quando necessário
    const sharp = (await import('sharp')).default;

    // Por padrão, tentaremos converter para WebP e também gerar thumbnail.
    let targetPath = `${type}/${resourceId}/${baseSlug}-${stamp}.webp`;
    let thumbPath = `${type}/${resourceId}/${baseSlug}-${stamp}-thumb.webp`;
    let mainMime = 'image/webp';

    let webpBuf: Buffer | null = null;
    let thumbBuf: Buffer | null = null;

    try {
      // Se já vier WebP, podemos reaproveitar o buffer
      if (file.type === 'image/webp') {
        webpBuf = buffer;
        // Thumbnail 400px largura
        thumbBuf = await sharp(buffer).resize({ width: 400 }).webp({ quality: 80 }).toBuffer();
      } else {
        // Conversão para WebP
        webpBuf = await sharp(buffer).webp({ quality: 82 }).toBuffer();
        // Thumbnail 400px largura, mantendo proporção
        thumbBuf = await sharp(buffer).resize({ width: 400 }).webp({ quality: 80 }).toBuffer();
      }
    } catch (convErr: any) {
      console.error('⚠️ Falha na conversão com Sharp, fazendo fallback para original:', convErr?.message || convErr);
      // Fallback: usar o arquivo original sem conversão
      const origExt = (originalName.match(/\.([a-z0-9]+)$/i)?.[1] || 'jpg').toLowerCase();
      targetPath = `${type}/${resourceId}/${baseSlug}-${stamp}.${origExt}`;
      // Não geramos thumbnail no fallback para simplificar
      thumbPath = '';
      mainMime = file.type || 'image/jpeg';
      webpBuf = buffer;
      thumbBuf = null;
    }

    // Upload do arquivo principal
    const uploaded = await uploadBinary(BUCKET, targetPath, webpBuf!, mainMime);

    // Upload do thumbnail (se disponível)
    let uploadedThumb: { publicUrl: string } | null = null;
    if (thumbBuf && thumbPath) {
      uploadedThumb = await uploadBinary(BUCKET, thumbPath, thumbBuf, 'image/webp');
    }

    const result = {
      ok: true,
      bucket: BUCKET,
      path: targetPath,
      url: uploaded.publicUrl,
      thumbPath: uploadedThumb ? thumbPath : undefined,
      thumbUrl: uploadedThumb ? uploadedThumb.publicUrl : undefined,
      sizeKb: Math.round((webpBuf?.length || buffer.length) / 1024),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Erro em /api/uploads:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Erro interno' }), { status: 500 });
  }
}