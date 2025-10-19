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
  const base = requestId ? { context, requestId } : { context };
  const log = (level: LogLevel, message: string, meta?: Record<string, any>) => {
    const common = { level, ts: new Date().toISOString(), message, ...base };
    if (meta !== undefined) {
      emit({ ...common, meta } as LogEntry);
    } else {
      emit(common as LogEntry);
    }
  };
  return {
    info: (message: string, meta?: Record<string, any>) => log('info', message, meta),
    warn: (message: string, meta?: Record<string, any>) => log('warn', message, meta),
    error: (message: string, meta?: Record<string, any>) => log('error', message, meta),
    debug: (message: string, meta?: Record<string, any>) => log('debug', message, meta),
  };
};

export const withRequestIdHeader = <T extends Response>(response: T, requestId: string): T => {
  try {
    response.headers.set('X-Request-Id', requestId);
  } catch {
    // ignore
  }
  return response;
};