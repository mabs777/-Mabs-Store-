import { db } from '../../server/db.ts';
import { setCorsHeaders, requireAdminAuth } from '../_lib/auth.ts';

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

  if (!requireAdminAuth(req, res)) return;

  try {
    db.resetToDefaults();
    res.status(200).json({ success: true, message: 'Store database reset to initial verified catalogue.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
