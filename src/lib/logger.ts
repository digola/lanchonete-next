import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LogEntry = {
  level: LogLevel;
  ts: string;
  context: string;
  requestId?: string;
  message: string;
  meta?: Record<string, any>;
};

function emit(entry: LogEntry) {
  try {
    // Em desenvolvimento, manter legível
    if (process.env.NODE_ENV !== 'production') {
      const base = `[${entry.ts}] [${entry.level.toUpperCase()}] [${entry.context}]${entry.requestId ? ` [req:${entry.requestId}]` : ''}`;
      if (entry.meta) {
        console.log(base, entry.message, entry.meta);
      } else {
        console.log(base, entry.message);
      }
    } else {
      // Em produção, JSON estruturado
      console.log(JSON.stringify(entry));
    }
  } catch (e) {
    // fallback
    console.log(entry.level.toUpperCase(), entry.context, entry.message);
  }
}

export const getOrCreateRequestId = (req?: NextRequest): string => {
  const headerId = req?.headers.get('x-request-id') || req?.headers.get('x-correlation-id');
  return headerId || randomUUID();
};

export const createLogger = (context: string, requestId?: string) => {
  const base = { context, requestId };
  return {
    info: (message: string, meta?: Record<string, any>) => emit({ level: 'info', ts: new Date().toISOString(), message, meta, ...base }),
    warn: (message: string, meta?: Record<string, any>) => emit({ level: 'warn', ts: new Date().toISOString(), message, meta, ...base }),
    error: (message: string, meta?: Record<string, any>) => emit({ level: 'error', ts: new Date().toISOString(), message, meta, ...base }),
    debug: (message: string, meta?: Record<string, any>) => emit({ level: 'debug', ts: new Date().toISOString(), message, meta, ...base }),
  };
};

export const withRequestIdHeader = (response: Response, requestId: string) => {
  try {
    response.headers.set('X-Request-Id', requestId);
  } catch {
    // ignore
  }
  return response;
};