import { db } from '../../../server/db.ts';
import { setCorsHeaders } from '../../_lib/auth.ts';

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

  const id = req.query?.id as string;
  if (!id) {
    res.status(400).json({ success: false, error: 'App ID is required.' });
    return;
  }

  try {
    const appItem = db.getAppById(id);
    if (!appItem) {
      res.status(404).json({ success: false, error: 'App not found in Mabs Store catalogue.' });
      return;
    }
    res.status(200).json({ success: true, data: appItem });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
