import { db } from '../server/db.ts';
import { parseRequestBody, setCorsHeaders, requireAdminAuth, extractSubpath } from './_lib/auth.ts';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // All admin routes require authentication
  if (!requireAdminAuth(req, res)) return;

  const subpath = extractSubpath(req, '/api/admin');
  const parts = subpath.split('/').filter(Boolean);

  try {
    // POST /api/admin/change-password
    if (parts[0] === 'change-password') {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method Not Allowed' });
        return;
      }
      const body = await parseRequestBody(req);
      const { currentPassword, newPassword } = body || {};

      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, error: 'Current password and new password are required.' });
        return;
      }
      if (newPassword.length < 4) {
        res.status(400).json({ success: false, error: 'New password must be at least 4 characters.' });
        return;
      }

      const isCurrentValid = db.verifyAdminPassword(currentPassword);
      if (!isCurrentValid) {
        res.status(400).json({ success: false, error: 'Current password does not match.' });
        return;
      }

      const changed = db.changeAdminPassword(newPassword);
      if (changed) {
        res.status(200).json({ success: true, message: 'Admin password changed successfully!' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update password.' });
      }
      return;
    }

    // POST /api/admin/reset-data
    if (parts[0] === 'reset-data') {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method Not Allowed' });
        return;
      }
      db.resetToDefaults();
      res.status(200).json({ success: true, message: 'Store database reset to initial catalogue.' });
      return;
    }

    // Routes under /api/admin/apps
    if (parts[0] === 'apps') {
      // POST /api/admin/apps
      if (parts.length === 1 && req.method === 'POST') {
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
        return;
      }

      const appId = decodeURIComponent(parts[1] || '');
      if (!appId) {
        res.status(400).json({ success: false, error: 'App ID is required.' });
        return;
      }

      // PATCH or POST /api/admin/apps/:id/featured
      if (parts[2] === 'featured' && (req.method === 'PATCH' || req.method === 'POST')) {
        const body = await parseRequestBody(req);
        const { isFeatured } = body || {};
        const updated = db.toggleFeatured(appId, isFeatured);
        if (!updated) {
          res.status(404).json({ success: false, error: 'App not found.' });
          return;
        }
        res.status(200).json({
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

        const updated = db.updateApp(appId, body);
        if (!updated) {
          res.status(404).json({ success: false, error: 'App not found for update.' });
          return;
        }
        res.status(200).json({ success: true, data: updated, message: 'App updated successfully!' });
        return;
      }

      // DELETE /api/admin/apps/:id
      if (parts.length === 2 && req.method === 'DELETE') {
        const success = db.deleteApp(appId);
        if (!success) {
          res.status(404).json({ success: false, error: 'App not found to delete.' });
          return;
        }
        res.status(200).json({ success: true, message: 'App permanently deleted from store.' });
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
          res.status(400).json({ success: false, error: 'Category name is required.' });
          return;
        }
        const category = db.addCategory(name.trim(), icon, description);
        res.status(201).json({ success: true, data: category, message: 'Category added successfully.' });
        return;
      }

      // DELETE /api/admin/categories/:id
      if (parts.length === 2 && req.method === 'DELETE') {
        const catId = decodeURIComponent(parts[1]);
        const deleted = db.deleteCategory(catId);
        if (!deleted) {
          res.status(404).json({ success: false, error: 'Category not found.' });
          return;
        }
        res.status(200).json({ success: true, message: 'Category removed successfully.' });
        return;
      }
    }

    res.status(404).json({ success: false, error: 'Admin API endpoint not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
