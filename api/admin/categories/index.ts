import { db } from '../../../server/db.ts';
import { parseRequestBody, setCorsHeaders, requireAdminAuth } from '../../_lib/auth.ts';

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
    const { name, icon, description } = body || {};
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'Category name is required.' });
      return;
    }
    const category = db.addCategory(name.trim(), icon, description);
    res.status(201).json({ success: true, data: category, message: 'Category added successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
