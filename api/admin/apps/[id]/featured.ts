import { db } from '../../../../server/db.ts';
import { parseRequestBody, setCorsHeaders, requireAdminAuth } from '../../../_lib/auth.ts';

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

  if (req.method !== 'PATCH' && req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = await parseRequestBody(req);
    const { isFeatured } = body || {};
    const updated = db.toggleFeatured(id, isFeatured);
    if (!updated) {
      res.status(404).json({ success: false, error: 'App not found.' });
      return;
    }
    res.status(200).json({
      success: true,
      data: updated,
      message: `App is now ${updated.isFeatured ? 'Featured ⭐' : 'Unfeatured'}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
