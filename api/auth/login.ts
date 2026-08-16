import { db } from '../../server/db.ts';
import { parseRequestBody, setCorsHeaders } from '../_lib/auth.ts';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

    const isValid = db.verifyAdminPassword(password);
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
}
