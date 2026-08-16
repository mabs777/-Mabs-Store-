import { db } from './_lib/db.js';
import { parseRequestBody, sendJsonResponse, handleOptions, requireAdminAuth, extractSubpath } from './_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;

  // All admin routes require authentication
  if (!requireAdminAuth(req, res)) return;

  const subpath = extractSubpath(req, '/api/admin');
  const parts = subpath.split('/').filter(Boolean);

  try {
    // POST /api/admin/change-password
    if (parts[0] === 'change-password') {
      if (req.method !== 'POST') {
        sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
        return;
      }
      const body = await parseRequestBody(req);
      const { currentPassword, newPassword } = body || {};

      if (!currentPassword || !newPassword) {
        sendJsonResponse(res, 400, { success: false, error: 'Current password and new password are required.' });
        return;
      }
      if (newPassword.length < 4) {
        sendJsonResponse(res, 400, { success: false, error: 'New password must be at least 4 characters.' });
        return;
      }

      const isCurrentValid = await db.verifyAdminPassword(currentPassword);
      if (!isCurrentValid) {
        sendJsonResponse(res, 400, { success: false, error: 'Current password does not match.' });
        return;
      }

      const changed = await db.changeAdminPassword(newPassword);
      if (changed) {
        sendJsonResponse(res, 200, { success: true, message: 'Admin password changed successfully!' });
      } else {
        sendJsonResponse(res, 500, { success: false, error: 'Failed to update password.' });
      }
      return;
    }

    // POST /api/admin/reset-data
    if (parts[0] === 'reset-data') {
      if (req.method !== 'POST') {
        sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
        return;
      }
      await db.resetToDefaults();
      sendJsonResponse(res, 200, { success: true, message: 'Store database reset to initial catalogue.' });
      return;
    }

    // Routes under /api/admin/apps
    if (parts[0] === 'apps') {
      // POST /api/admin/apps
      if (parts.length === 1 && req.method === 'POST') {
        const body = await parseRequestBody(req);
        const { name, developer, category, apkUrl } = body || {};

        if (!name || !name.trim()) {
          sendJsonResponse(res, 400, { success: false, error: 'App Name is required.' });
          return;
        }
        if (!developer || !developer.trim()) {
          sendJsonResponse(res, 400, { success: false, error: 'Developer Name is required.' });
          return;
        }
        if (!category || !category.trim()) {
          sendJsonResponse(res, 400, { success: false, error: 'Category is required.' });
          return;
        }
        if (!apkUrl || !apkUrl.trim()) {
          sendJsonResponse(res, 400, { success: false, error: 'APK Download URL is required.' });
          return;
        }

        const created = await db.createApp(body);
        sendJsonResponse(res, 201, { success: true, data: created, message: 'App successfully published to Mabs Store!' });
        return;
      }

      const appId = decodeURIComponent(parts[1] || '');
      if (!appId) {
        sendJsonResponse(res, 400, { success: false, error: 'App ID is required.' });
        return;
      }

      // PATCH or POST /api/admin/apps/:id/featured
      if (parts[2] === 'featured' && (req.method === 'PATCH' || req.method === 'POST')) {
        const body = await parseRequestBody(req);
        const { isFeatured } = body || {};
        const updated = await db.toggleFeatured(appId, isFeatured);
        if (!updated) {
          sendJsonResponse(res, 404, { success: false, error: 'App not found.' });
          return;
        }
        sendJsonResponse(res, 200, {
          success: true,
          data: updated,
          message: `App is now ${updated.isFeatured ? 'Featured ⭐' : 'Unfeatured'}`,
        });
        return;
      }

      // PUT /api/admin/apps/:id
      if (parts.length === 2 && req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { name, developer, apkUrl } = body || {};

        if (name !== undefined && !name.trim()) {
          sendJsonResponse(res, 400, { success: false, error: 'App Name cannot be empty.' });
          return;
        }
        if (developer !== undefined && !developer.trim()) {
          sendJsonResponse(res, 400, { success: false, error: 'Developer Name cannot be empty.' });
          return;
        }
        if (apkUrl !== undefined && !apkUrl.trim()) {
          sendJsonResponse(res, 400, { success: false, error: 'APK Download URL cannot be empty.' });
          return;
        }

        const updated = await db.updateApp(appId, body);
        if (!updated) {
          sendJsonResponse(res, 404, { success: false, error: 'App not found for update.' });
          return;
        }
        sendJsonResponse(res, 200, { success: true, data: updated, message: 'App updated successfully!' });
        return;
      }

      // DELETE /api/admin/apps/:id
      if (parts.length === 2 && req.method === 'DELETE') {
        const success = await db.deleteApp(appId);
        if (!success) {
          sendJsonResponse(res, 404, { success: false, error: 'App not found to delete.' });
          return;
        }
        sendJsonResponse(res, 200, { success: true, message: 'App permanently deleted from store.' });
        return;
      }
    }

    // Routes under /api/admin/categories
    if (parts[0] === 'categories') {
      // POST /api/admin/categories
      if (parts.length === 1 && req.method === 'POST') {
        const body = await parseRequestBody(req);
        const { name, icon, description } = body || {};
        if (!name || !name.trim()) {
          sendJsonResponse(res, 400, { success: false, error: 'Category name is required.' });
          return;
        }
        const category = await db.addCategory(name.trim(), icon, description);
        sendJsonResponse(res, 201, { success: true, data: category, message: 'Category added successfully.' });
        return;
      }

      // DELETE /api/admin/categories/:id
      if (parts.length === 2 && req.method === 'DELETE') {
        const catId = decodeURIComponent(parts[1]);
        const deleted = await db.deleteCategory(catId);
        if (!deleted) {
          sendJsonResponse(res, 404, { success: false, error: 'Category not found.' });
          return;
        }
        sendJsonResponse(res, 200, { success: true, message: 'Category removed successfully.' });
        return;
      }
    }

    sendJsonResponse(res, 404, { success: false, error: 'Admin API endpoint not found.' });
  } catch (err: any) {
    console.error('[API Admin Error]:', err?.stack || err?.message || err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || 'Internal server error' });
  }
}
