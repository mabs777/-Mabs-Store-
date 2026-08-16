import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger for API calls
  app.use('/api', (req, res, next) => {
    // API request handling
    next();
  });

  // Authentication Middleware for Admin routes
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const isValid = db.verifyToken(token);
    if (!isValid) {
      res.status(403).json({ success: false, error: 'Forbidden: Invalid or expired admin session. Please log in again.' });
      return;
    }

    next();
  };

  // ==========================================
  // PUBLIC VISITOR API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', store: '🚀 Mabs Store ⚡', time: new Date().toISOString() });
  });

  // Get Store Stats
  app.get('/api/stats', (req, res) => {
    try {
      const stats = db.getStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get Categories
  app.get('/api/categories', (req, res) => {
    try {
      const categories = db.getCategories();
      res.json({ success: true, data: categories });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get Apps (with search, category filter, sorting, featured filter)
  app.get('/api/apps', (req, res) => {
    try {
      const { q, category, sort, featured } = req.query;
      const apps = db.getApps({
        q: typeof q === 'string' ? q : undefined,
        category: typeof category === 'string' ? category : undefined,
        sort: typeof sort === 'string' ? sort : undefined,
        featured: featured === 'true',
      });
      res.json({ success: true, count: apps.length, data: apps });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get Single App details
  app.get('/api/apps/:id', (req, res) => {
    try {
      const appItem = db.getAppById(req.params.id);
      if (!appItem) {
        res.status(404).json({ success: false, error: 'App not found in Mabs Store catalogue.' });
        return;
      }
      res.json({ success: true, data: appItem });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Track APK Download & Return download info
  app.post('/api/apps/:id/download', (req, res) => {
    try {
      const result = db.recordDownload(req.params.id);
      if (!result) {
        res.status(404).json({ success: false, error: 'App not found.' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Rate an App (Visitor)
  app.post('/api/apps/:id/rate', (req, res) => {
    try {
      const { rating } = req.body;
      const result = db.rateApp(req.params.id, Number(rating));
      if (!result) {
        res.status(404).json({ success: false, error: 'App not found.' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Admin Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { password, username = 'admin' } = req.body;
      if (!password) {
        res.status(400).json({ success: false, error: 'Admin password is required.' });
        return;
      }

      const isValid = db.verifyAdminPassword(password);
      if (!isValid) {
        res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
        return;
      }

      const token = db.generateToken(username);
      res.json({
        success: true,
        token,
        username,
        role: 'admin',
        message: 'Admin access granted successfully.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Token Verification
  app.get('/api/auth/verify', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.json({ success: false, authenticated: false });
        return;
      }
      const token = authHeader.split(' ')[1];
      const isValid = db.verifyToken(token);
      res.json({ success: isValid, authenticated: isValid, role: isValid ? 'admin' : undefined });
    } catch (err: any) {
      res.status(500).json({ success: false, authenticated: false, error: err.message });
    }
  });

  // ==========================================
  // PROTECTED ADMIN ROUTES (CRUD & Store Controls)
  // ==========================================

  // Create App
  app.post('/api/admin/apps', requireAdmin, (req, res) => {
    try {
      const { name, developer, category, version, appSize, apkUrl } = req.body;

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

      const created = db.createApp(req.body);
      res.status(201).json({ success: true, data: created, message: 'App successfully published to Mabs Store!' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update App
  app.put('/api/admin/apps/:id', requireAdmin, (req, res) => {
    try {
      const { name, developer, category, apkUrl } = req.body;

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

      const updated = db.updateApp(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: 'App not found for update.' });
        return;
      }

      res.json({ success: true, data: updated, message: 'App updated successfully!' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete App
  app.delete('/api/admin/apps/:id', requireAdmin, (req, res) => {
    try {
      const success = db.deleteApp(req.params.id);
      if (!success) {
        res.status(404).json({ success: false, error: 'App not found to delete.' });
        return;
      }
      res.json({ success: true, message: 'App permanently deleted from store.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle Featured status
  app.patch('/api/admin/apps/:id/featured', requireAdmin, (req, res) => {
    try {
      const { isFeatured } = req.body;
      const updated = db.toggleFeatured(req.params.id, isFeatured);
      if (!updated) {
        res.status(404).json({ success: false, error: 'App not found.' });
        return;
      }
      res.json({ success: true, data: updated, message: `App is now ${updated.isFeatured ? 'Featured ⭐' : 'Unfeatured'}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Add Category
  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    try {
      const { name, icon, description } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, error: 'Category name is required.' });
        return;
      }
      const category = db.addCategory(name.trim(), icon, description);
      res.status(201).json({ success: true, data: category, message: 'Category added successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete Category
  app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
    try {
      const deleted = db.deleteCategory(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Category not found.' });
        return;
      }
      res.json({ success: true, message: 'Category removed successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Change Admin Password
  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
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
        res.json({ success: true, message: 'Admin password changed successfully!' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update password.' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset Demo Data
  app.post('/api/admin/reset-data', requireAdmin, (req, res) => {
    try {
      db.resetToDefaults();
      res.json({ success: true, message: 'Store database reset to initial verified catalogue.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // VITE STATIC ASSET & SPA SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mabs Store ⚡ server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
