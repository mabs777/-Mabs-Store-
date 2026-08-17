import { db } from './_lib/db.js';
import { sendJsonResponse, handleOptions } from './_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const stats = await db.getStats();
    sendJsonResponse(res, 200, { success: true, data: stats });
  } catch (err: any) {
    console.error('[API Stats Error]:', err?.stack || err?.message || err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || 'Internal server error' });
  }
}
