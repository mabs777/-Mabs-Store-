import { db } from '../../server/db.ts';
import { parseRequestBody, setCorsHeaders, requireAdminAuth } from '../_lib/auth.ts';

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
    const body = await parseRequestBody(req);
    const { currentPassword, newPassword } = body || {};

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 4) {
      res.status(400).json({ success: false, error: 'New password must be at least 4 characters.' });
      return;
    }

    const isCurrentValid = db.verifyAdminPassword(currentPassword);
    if (!isCurrentValid) {
      res.status(400).json({ success: false, error: 'Current password does not match.' });
      return;
    }

    const changed = db.changeAdminPassword(newPassword);
    if (changed) {
      res.status(200).json({ success: true, message: 'Admin password changed successfully!' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update password.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
