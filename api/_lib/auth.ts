import type { IncomingMessage, ServerResponse } from 'http';
import { db } from './db.ts';

export interface VercelReq extends IncomingMessage {
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
  body?: any;
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface VercelRes extends ServerResponse {
  status?: (statusCode: number) => VercelRes;
  json?: (jsonBody: any) => void;
  send?: (body: any) => void;
  setHeader: (name: string, value: string | number | readonly string[]) => this;
}

export function setCorsHeaders(res: any) {
  try {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
      );
    }
  } catch (e) {
    // Non-fatal header error fallback
  }
}

export function sendJsonResponse(res: any, statusCode: number, data: any) {
  setCorsHeaders(res);
  try {
    if (typeof res.status === 'function') {
      res.status(statusCode);
    } else {
      res.statusCode = statusCode;
    }

    if (typeof res.json === 'function') {
      res.json(data);
    } else if (typeof res.send === 'function') {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
      }
      res.send(JSON.stringify(data));
    } else if (typeof res.end === 'function') {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(data));
    }
  } catch (err: any) {
    console.error('[Mabs Store Response Error]:', err);
    try {
      res.statusCode = statusCode;
      res.end(JSON.stringify(data));
    } catch {}
  }
}

export function handleOptions(req: any, res: any): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    if (typeof res.status === 'function') {
      res.status(200);
    } else {
      res.statusCode = 200;
    }
    if (typeof res.end === 'function') {
      res.end();
    } else if (typeof res.send === 'function') {
      res.send('');
    }
    return true;
  }
  return false;
}

export async function parseRequestBody(req: any): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
    return req.body;
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

export function requireAdminAuth(req: any, res: any): boolean {
  const authHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendJsonResponse(res, 401, { success: false, error: 'Unauthorized: Admin authentication token required.' });
    return false;
  }

  const token = authHeader.split(' ')[1];
  const isValid = db.verifyToken(token);
  if (!isValid) {
    sendJsonResponse(res, 403, { success: false, error: 'Forbidden: Invalid or expired admin session. Please log in again.' });
    return false;
  }

  return true;
}

export function extractSubpath(req: any, prefix: string): string {
  // Check req.query.sub if passed via rewrite
  if (req.query?.sub) {
    const sub = Array.isArray(req.query.sub) ? req.query.sub.join('/') : req.query.sub;
    return sub.replace(/^\/+|\/+$/g, '');
  }

  const url = req.url || '';
  try {
    const parsed = new URL(url, 'http://localhost');
    const subParam = parsed.searchParams.get('sub');
    if (subParam) {
      return subParam.replace(/^\/+|\/+$/g, '');
    }
    const pathname = parsed.pathname;
    const cleaned = pathname.replace(new RegExp(`^${prefix}`), '');
    return cleaned.replace(/^\/+|\/+$/g, '');
  } catch {
    const pathname = url.split('?')[0];
    const cleaned = pathname.replace(new RegExp(`^${prefix}`), '');
    return cleaned.replace(/^\/+|\/+$/g, '');
  }
}

export function getQueryParams(req: any): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        params[key] = value;
      } else if (Array.isArray(value)) {
        params[key] = value[0];
      }
    }
  }
  if (req.url && req.url.includes('?')) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      parsed.searchParams.forEach((val, key) => {
        if (!params[key]) {
          params[key] = val;
        }
      });
    } catch {
      // ignore
    }
  }
  return params;
}
