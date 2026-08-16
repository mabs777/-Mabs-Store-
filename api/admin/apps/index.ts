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
    const { name, developer, category, apkUrl } = body || {};

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'App Name is required.' });
      return;
    }
    if (!developer || !developer.trim()) {
      res.status(400).json({ success: false, error: 'Developer Name is required.' });
      return;
    }
    if (!category || !category.trim()) {
      res.status(400).json({ success: false, error: 'Category is required.' });
      return;
    }
    if (!apkUrl || !apkUrl.trim()) {
      res.status(400).json({ success: false, error: 'APK Download URL is required.' });
      return;
    }

    const created = db.createApp(body);
    res.status(201).json({ success: true, data: created, message: 'App successfully published to Mabs Store!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
