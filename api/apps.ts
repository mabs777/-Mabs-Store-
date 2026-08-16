import { db } from './_lib/db.js';
import { parseRequestBody, sendJsonResponse, handleOptions, extractSubpath, getQueryParams } from './_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;

  const subpath = extractSubpath(req, '/api/apps');
  const parts = subpath.split('/').filter(Boolean);

  try {
    // GET /api/apps (List apps)
    if (parts.length === 0) {
      if (req.method !== 'GET') {
        sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
        return;
      }
      const queryParams = getQueryParams(req);
      const { q, category, sort, featured } = queryParams;
      const apps = await db.getApps({
        q: typeof q === 'string' ? q : undefined,
        category: typeof category === 'string' ? category : undefined,
        sort: typeof sort === 'string' ? sort : undefined,
        featured: featured === 'true',
      });
      sendJsonResponse(res, 200, { success: true, count: apps.length, data: apps });
      return;
    }

    const appId = decodeURIComponent(parts[0]);

    // POST /api/apps/:id/download
    if (parts.length === 2 && parts[1] === 'download') {
      if (req.method !== 'POST') {
        sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
        return;
      }
      const result = await db.recordDownload(appId);
      if (!result) {
        sendJsonResponse(res, 404, { success: false, error: 'App not found.' });
        return;
      }
      sendJsonResponse(res, 200, { success: true, data: result });
      return;
    }

    // POST /api/apps/:id/rate
    if (parts.length === 2 && parts[1] === 'rate') {
      if (req.method !== 'POST') {
        sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
        return;
      }
      const body = await parseRequestBody(req);
      const { rating } = body || {};
      const result = await db.rateApp(appId, Number(rating));
      if (!result) {
        sendJsonResponse(res, 404, { success: false, error: 'App not found.' });
        return;
      }
      sendJsonResponse(res, 200, { success: true, data: result });
      return;
    }

    // GET /api/apps/:id
    if (parts.length === 1) {
      if (req.method !== 'GET') {
        sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
        return;
      }
      const appItem = await db.getAppById(appId);
      if (!appItem) {
        sendJsonResponse(res, 404, { success: false, error: 'App not found in Mabs Store catalogue.' });
        return;
      }
      sendJsonResponse(res, 200, { success: true, data: appItem });
      return;
    }

    sendJsonResponse(res, 404, { success: false, error: 'Apps endpoint not found.' });
  } catch (err: any) {
    console.error('[API Apps Error]:', err?.stack || err?.message || err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || 'Internal server error' });
  }
}
