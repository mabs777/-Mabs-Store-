import { db } from './_lib/db.js';
import { parseRequestBody, sendJsonResponse, handleOptions, extractSubpath } from './_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;

  const subpath = extractSubpath(req, '/api/auth');

  // POST /api/auth/login
  if (subpath === 'login' || (req.method === 'POST' && subpath === '')) {
    if (req.method !== 'POST') {
      sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
      return;
    }

    try {
      const body = await parseRequestBody(req);
      const { password, username = 'admin' } = body || {};

      if (!password) {
        sendJsonResponse(res, 400, { success: false, error: 'Admin password is required.' });
        return;
      }

      const isValid = await db.verifyAdminPassword(password);
      if (!isValid) {
        sendJsonResponse(res, 401, { success: false, error: 'Invalid admin credentials.' });
        return;
      }

      const token = db.generateToken(username);
      sendJsonResponse(res, 200, {
        success: true,
        token,
        username,
        role: 'admin',
        message: 'Admin access granted successfully.',
      });
    } catch (err: any) {
      console.error('[API Auth Login Error]:', err?.stack || err?.message || err);
      sendJsonResponse(res, 500, { success: false, error: err?.message || 'Internal server error' });
    }
    return;
  }

  // GET /api/auth/verify
  if (subpath === 'verify' || (req.method === 'GET' && subpath === '')) {
    if (req.method !== 'GET') {
      sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
      return;
    }

    try {
      const authHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendJsonResponse(res, 200, { success: false, authenticated: false });
        return;
      }

      const token = authHeader.split(' ')[1];
      const isValid = db.verifyToken(token);
      sendJsonResponse(res, 200, {
        success: isValid,
        authenticated: isValid,
        role: isValid ? 'admin' : undefined,
      });
    } catch (err: any) {
      console.error('[API Auth Verify Error]:', err?.stack || err?.message || err);
      sendJsonResponse(res, 500, { success: false, authenticated: false, error: err?.message || 'Internal server error' });
    }
    return;
  }

  sendJsonResponse(res, 404, { success: false, error: 'Auth endpoint not found.' });
}
