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
    const { q, category, sort, featured } = req.query || {};
    const apps = db.getApps({
      q: typeof q === 'string' ? q : undefined,
      category: typeof category === 'string' ? category : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      featured: featured === 'true',
    });
    res.status(200).json({ success: true, count: apps.length, data: apps });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
