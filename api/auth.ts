import { db } from '../server/db.ts';
import { parseRequestBody, setCorsHeaders, extractSubpath } from './_lib/auth.ts';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const subpath = extractSubpath(req, '/api/auth');

  // POST /api/auth/login
  if (subpath === 'login' || (req.method === 'POST' && subpath === '')) {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method Not Allowed' });
      return;
    }

    try {
      const body = await parseRequestBody(req);
      const { password, username = 'admin' } = body || {};

      if (!password) {
        res.status(400).json({ success: false, error: 'Admin password is required.' });
        return;
      }

      const isValid = await db.verifyAdminPassword(password);
      if (!isValid) {
        res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
        return;
      }

      const token = db.generateToken(username);
      res.status(200).json({
        success: true,
        token,
        username,
        role: 'admin',
        message: 'Admin access granted successfully.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
    return;
  }

  // GET /api/auth/verify
  if (subpath === 'verify' || (req.method === 'GET' && subpath === '')) {
    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Method Not Allowed' });
      return;
    }

    try {
      const authHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(200).json({ success: false, authenticated: false });
        return;
      }

      const token = authHeader.split(' ')[1];
      const isValid = db.verifyToken(token);
      res.status(200).json({
        success: isValid,
        authenticated: isValid,
        role: isValid ? 'admin' : undefined,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, authenticated: false, error: err.message || 'Internal server error' });
    }
    return;
  }

  res.status(404).json({ success: false, error: 'Auth endpoint not found.' });
}
