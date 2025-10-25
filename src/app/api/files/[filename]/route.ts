import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

// Simple content-type mapping for common image formats
const mimeTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function preferSupabaseStorage(): boolean {
  const storagePref = process.env.UPLOAD_STORAGE || 'supabase';
  return storagePref !== 'filesystem';
}

/**
 * Stream files saved in UPLOAD_DIR (defaults to public/uploads/images).
 * In production we prefer Supabase Storage to avoid bundling large local directories.
 *
 * GET /api/files/:filename
 */
export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  try {
    // If Supabase is configured, redirect to its public URL to serve the asset
    if (preferSupabaseStorage()) {
      const bucket = process.env.SUPABASE_BUCKET_IMAGES || 'images';
      const supabaseUrl = process.env.SUPABASE_URL;
      if (!supabaseUrl) {
        return NextResponse.json({ error: 'Storage não configurado' }, { status: 500 });
      }
      const redirectUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(params.filename)}`;
      return NextResponse.redirect(redirectUrl, 307);
    }

    // Fallback: local filesystem only when explicitly using filesystem storage
    const baseDirEnv = process.env.UPLOAD_DIR || 'public/uploads/images';
    // Resolve to absolute path from project root (/app in container)
    const absolutePath = path.resolve(process.cwd(), baseDirEnv, params.filename);

    // Prevent path traversal
    const baseDirAbs = path.resolve(process.cwd(), baseDirEnv);
    if (!absolutePath.startsWith(baseDirAbs + path.sep)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const fsMod = await import('fs');
    await fsMod.promises.access(absolutePath, fsMod.constants.R_OK);
    const stat = await fsMod.promises.stat(absolutePath);

    const stream = fsMod.createReadStream(absolutePath);
    const headers = new Headers({
      'Content-Type': getContentType(absolutePath),
      'Content-Length': String(stat.size),
      'Last-Modified': stat.mtime.toUTCString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Accel-Buffering': 'no',
    });

    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('File serving error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}