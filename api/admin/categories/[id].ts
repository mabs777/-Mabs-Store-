import { db } from '../../../server/db.ts';
import { setCorsHeaders, requireAdminAuth } from '../../_lib/auth.ts';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const id = req.query?.id as string;
  if (!id) {
    res.status(400).json({ success: false, error: 'Category ID is required.' });
    return;
  }

  if (!requireAdminAuth(req, res)) return;

  if (req.method !== 'DELETE') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const deleted = db.deleteCategory(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Category not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Category removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
