import { NextRequest, NextResponse } from 'next/server';
import { getPublicUrl } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Validação básica de segurança para evitar path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Servir sempre do Supabase Storage em produção
    try {
      const bucket = process.env.SUPABASE_BUCKET_IMAGES || 'images';
      const publicUrl = getPublicUrl(bucket, filename);
      
      // Redireciona para a URL pública do Supabase
      return NextResponse.redirect(publicUrl, 302);
    } catch (supabaseError) {
      // Em produção, se Supabase falhar, retorna erro
      if (process.env.NODE_ENV === 'production') {
        console.error('Supabase storage error:', supabaseError);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      
      console.log('Supabase storage not available, trying local filesystem...');
    }

    // Fallback: servir do sistema de arquivos local APENAS em desenvolvimento
    // E APENAS se explicitamente habilitado
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_LOCAL_STORAGE === 'true') {
      // Importação dinâmica para evitar bundling em produção
      const [fs, path] = await Promise.all([
        import('fs'),
        import('path')
      ]);
      
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'images', filename);
      
      try {
        const stats = await fs.promises.stat(filePath);
        
        if (!stats.isFile()) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Usar ReadableStream mais simples para reduzir overhead
        const buffer = await fs.promises.readFile(filePath);
        
        // Determinar o tipo de conteúdo baseado na extensão
        const ext = path.extname(filename).toLowerCase();
        const contentType = getContentType(ext);

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch (error) {
        console.error('Error serving file:', error);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    // Se chegou até aqui, não conseguiu servir o arquivo
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Error in file route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Função mais leve para determinar content-type
function getContentType(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}