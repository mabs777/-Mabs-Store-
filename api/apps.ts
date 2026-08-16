import { db } from '../server/db.ts';
import { parseRequestBody, setCorsHeaders, extractSubpath, getQueryParams } from './_lib/auth.ts';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const subpath = extractSubpath(req, '/api/apps');
  const parts = subpath.split('/').filter(Boolean);

  try {
    // GET /api/apps (List apps)
    if (parts.length === 0) {
      if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method Not Allowed' });
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
      res.status(200).json({ success: true, count: apps.length, data: apps });
      return;
    }

    const appId = decodeURIComponent(parts[0]);

    // POST /api/apps/:id/download
    if (parts.length === 2 && parts[1] === 'download') {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method Not Allowed' });
        return;
      }
      const result = await db.recordDownload(appId);
      if (!result) {
        res.status(404).json({ success: false, error: 'App not found.' });
        return;
      }
      res.status(200).json({ success: true, data: result });
      return;
    }

    // POST /api/apps/:id/rate
    if (parts.length === 2 && parts[1] === 'rate') {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method Not Allowed' });
        return;
      }
      const body = await parseRequestBody(req);
      const { rating } = body || {};
      const result = await db.rateApp(appId, Number(rating));
      if (!result) {
        res.status(404).json({ success: false, error: 'App not found.' });
        return;
      }
      res.status(200).json({ success: true, data: result });
      return;
    }

    // GET /api/apps/:id
    if (parts.length === 1) {
      if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method Not Allowed' });
        return;
      }
      const appItem = await db.getAppById(appId);
      if (!appItem) {
        res.status(404).json({ success: false, error: 'App not found in Mabs Store catalogue.' });
        return;
      }
      res.status(200).json({ success: true, data: appItem });
      return;
    }

    res.status(404).json({ success: false, error: 'Apps endpoint not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
