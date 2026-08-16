import { db } from '../../server/db.ts';
import { setCorsHeaders } from '../_lib/auth.ts';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
}
