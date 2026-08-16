import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../../server/db.ts';

export interface VercelReq extends IncomingMessage {
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
  body?: any;
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface VercelRes extends ServerResponse {
  status: (statusCode: number) => VercelRes;
  json: (jsonBody: any) => void;
  send: (body: any) => void;
  setHeader: (name: string, value: string | number | readonly string[]) => this;
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

  // If body is not pre-parsed by the serverless environment, parse from stream
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

export function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

export function requireAdminAuth(req: any, res: any): boolean {
  const authHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required.' });
    return false;
  }

  const token = authHeader.split(' ')[1];
  const isValid = db.verifyToken(token);
  if (!isValid) {
    res.status(403).json({ success: false, error: 'Forbidden: Invalid or expired admin session. Please log in again.' });
    return false;
  }

  return true;
}
