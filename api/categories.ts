import { db } from './_lib/db.ts';
import { sendJsonResponse, handleOptions } from './_lib/auth.ts';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const categories = await db.getCategories();
    sendJsonResponse(res, 200, { success: true, data: categories });
  } catch (err: any) {
    console.error('[API Categories Error]:', err?.stack || err?.message || err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || 'Internal server error' });
  }
}
