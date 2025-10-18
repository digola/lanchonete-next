import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
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

/**
 * Stream files saved in UPLOAD_DIR (defaults to public/uploads/images).
 * This route exists to reliably serve newly uploaded files even when Next.js
 * in production does not immediately serve files added to /public after build/start.
 *
 * GET /api/files/:filename
 */
export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const baseDirEnv = process.env.UPLOAD_DIR || 'public/uploads/images';
    // Resolve to absolute path from project root (/app in container)
    const absolutePath = path.resolve(process.cwd(), baseDirEnv, params.filename);

    // Prevent path traversal
    const baseDirAbs = path.resolve(process.cwd(), baseDirEnv);
    if (!absolutePath.startsWith(baseDirAbs + path.sep)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    await fs.promises.access(absolutePath, fs.constants.R_OK);
    const stat = await fs.promises.stat(absolutePath);

    const stream = fs.createReadStream(absolutePath);
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