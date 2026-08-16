import { db } from '../../../server/db.ts';
import { parseRequestBody, setCorsHeaders, requireAdminAuth } from '../../_lib/auth.ts';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const id = req.query?.id as string;
  if (!id) {
    res.status(400).json({ success: false, error: 'App ID is required.' });
    return;
  }

  if (!requireAdminAuth(req, res)) return;

  if (req.method === 'PUT') {
    try {
      const body = await parseRequestBody(req);
      const { name, developer, apkUrl } = body || {};

      if (name !== undefined && !name.trim()) {
        res.status(400).json({ success: false, error: 'App Name cannot be empty.' });
        return;
      }
      if (developer !== undefined && !developer.trim()) {
        res.status(400).json({ success: false, error: 'Developer Name cannot be empty.' });
        return;
      }
      if (apkUrl !== undefined && !apkUrl.trim()) {
        res.status(400).json({ success: false, error: 'APK Download URL cannot be empty.' });
        return;
      }

      const updated = db.updateApp(id, body);
      if (!updated) {
        res.status(404).json({ success: false, error: 'App not found for update.' });
        return;
      }

      res.status(200).json({ success: true, data: updated, message: 'App updated successfully!' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const success = db.deleteApp(id);
      if (!success) {
        res.status(404).json({ success: false, error: 'App not found to delete.' });
        return;
      }
      res.status(200).json({ success: true, message: 'App permanently deleted from store.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
