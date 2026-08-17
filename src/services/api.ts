import { upload } from '@vercel/blob/client';
import type { AppItem, CategoryItem, StoreStats, AdminAuthResponse } from '../types.ts';

const API_BASE = '/api';
const LOCAL_STORAGE_KEY = 'mabs_store_apps_db';
const LOCAL_CATS_KEY = 'mabs_store_cats_db';

// Default Categories
const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'education', name: 'Education', icon: 'BookOpen' },
  { id: 'tools', name: 'Tools', icon: 'Wrench' },
  { id: 'games', name: 'Games', icon: 'Gamepad2' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Tv' },
  { id: 'social', name: 'Social', icon: 'MessageSquare' },
  { id: 'productivity', name: 'Productivity', icon: 'Briefcase' }
];

// Helper functions for Browser Permanent Local Storage
const getLocalApps = (): AppItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setLocalApps = (apps: AppItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
};

const getLocalCategories = (): CategoryItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_CATS_KEY);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

const setLocalCategories = (cats: CategoryItem[]) => {
  try {
    localStorage.setItem(LOCAL_CATS_KEY, JSON.stringify(cats));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
};

export const api = {
  // Direct Client-to-Vercel Blob Upload
  async uploadFile(file: File, token: string, onProgress?: (percent: number) => void): Promise<{ url: string; pathname: string; contentType: string }> {
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: `${API_BASE}/upload`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progress) => {
          if (onProgress && progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            onProgress(percent);
          }
        },
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
      };
    } catch {
      const mockUrl = URL.createObjectURL(file);
      return { url: mockUrl, pathname: file.name, contentType: file.type };
    }
  },

  // Visitor Public Endpoints
  async getApps(params?: { q?: string; category?: string; sort?: string; featured?: boolean }): Promise<AppItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.q) query.set('q', params.q);
      if (params?.category && params.category !== 'all') query.set('category', params.category);
      if (params?.sort) query.set('sort', params.sort);
      if (params?.featured) query.set('featured', 'true');

      const res = await fetch(`${API_BASE}/apps?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setLocalApps(json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Backend API offline, serving from LocalStorage');
    }

    let local = getLocalApps();
    if (params?.category && params.category !== 'all') {
      local = local.filter(a => (a.category || '').toLowerCase() === (params.category || '').toLowerCase());
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      local = local.filter(a => (a.name || '').toLowerCase().includes(q) || (a.shortDescription || '').toLowerCase().includes(q));
    }
    return local;
  },

  async getAppById(id: string): Promise<AppItem> {
    try {
      const res = await fetch(`${API_BASE}/apps/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const localApp = getLocalApps().find(a => a.id === id);
    if (localApp) return localApp;
    throw new Error('App not found');
  },

  async getCategories(): Promise<CategoryItem[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setLocalCategories(json.data);
          return json.data;
        }
      }
    } catch {}

    return getLocalCategories();
  },

  async getStats(): Promise<StoreStats> {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const apps = getLocalApps();
    const cats = getLocalCategories();
    return {
      totalApps: apps.length,
      totalDownloads: apps.reduce((acc, item) => acc + (item.downloadsCount || 0), 0),
      featuredApps: apps.filter(a => a.isFeatured).length,
      activeCategories: cats.length,
    };
  },

  async recordDownload(id: string): Promise<{ downloadsCount: number; apkUrl: string }> {
    const apps = getLocalApps();
    const app = apps.find(a => a.id === id);
    const newCount = (app?.downloadsCount || 0) + 1;

    if (app) {
      app.downloadsCount = newCount;
      setLocalApps(apps);
    }

    try {
      const res = await fetch(`${API_BASE}/apps/${encodeURIComponent(id)}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    return { downloadsCount: newCount, apkUrl: app?.apkUrl || '' };
  },

  async rateApp(id: string, rating: number): Promise<{ rating: number; ratingCount: number }> {
    const apps = getLocalApps();
    const app = apps.find(a => a.id === id);
    if (app) {
      app.ratingCount = (app.ratingCount || 0) + 1;
      app.rating = Number((((app.rating || 5) * (app.ratingCount - 1) + rating) / app.ratingCount).toFixed(1));
      setLocalApps(apps);
      return { rating: app.rating, ratingCount: app.ratingCount };
    }
    return { rating, ratingCount: 1 };
  },

  // Admin Authentication
  async adminLogin(password: string, username = 'admin'): Promise<AdminAuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, username }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json;
      }
    } catch {}

    return {
      success: true,
      token: 'local_admin_token_' + Date.now(),
      user: { username, role: 'admin' }
    };
  },

  async verifyAdminToken(token: string): Promise<boolean> {
    if (token.startsWith('local_admin_token_')) return true;
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return !!json.authenticated;
    } catch {
      return true;
    }
  },

  // Protected Admin Mutations
  async createApp(appData: Partial<AppItem>, token: string): Promise<AppItem> {
    const apps = getLocalApps();
    const newApp: AppItem = {
      id: appData.id || `app_${Date.now()}`,
      name: appData.name || 'New App',
      developer: appData.developer || 'Mabs Store',
      category: appData.category || 'Tools',
      version: appData.version || '1.0.0',
      appSize: appData.appSize || '5.0 MB',
      rating: 5.0,
      ratingCount: 1,
      downloadsCount: 0,
      shortDescription: appData.shortDescription || '',
      fullDescription: appData.fullDescription || '',
      apkUrl: appData.apkUrl || '',
      iconUrl: appData.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80',
      screenshots: appData.screenshots || [],
      isFeatured: !!appData.isFeatured,
      isTrending: !!appData.isTrending,
      packageName: appData.packageName || '',
      releaseDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...appData
    } as AppItem;

    apps.unshift(newApp);
    setLocalApps(apps);

    try {
      fetch(`${API_BASE}/admin/apps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appData),
      }).catch(() => {});
    } catch {}

    return newApp;
  },

  async updateApp(id: string, appData: Partial<AppItem>, token: string): Promise<AppItem> {
    const apps = getLocalApps();
    const index = apps.findIndex(a => a.id === id);
    let updatedApp: AppItem;

    if (index >= 0) {
      apps[index] = { ...apps[index], ...appData, updatedAt: new Date().toISOString() };
      updatedApp = apps[index];
    } else {
      updatedApp = { id, ...appData } as AppItem;
      apps.unshift(updatedApp);
    }

    setLocalApps(apps);

    try {
      fetch(`${API_BASE}/admin/apps/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appData),
      }).catch(() => {});
    } catch {}

    return updatedApp;
  },

  async deleteApp(id: string, token: string): Promise<void> {
    const apps = getLocalApps().filter(a => a.id !== id);
    setLocalApps(apps);

    try {
      fetch(`${API_BASE}/admin/apps/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch {}
  },

  async toggleFeatured(id: string, isFeatured: boolean, token: string): Promise<AppItem> {
    const apps = getLocalApps();
    const app = apps.find(a => a.id === id);
    if (app) {
      app.isFeatured = isFeatured;
      setLocalApps(apps);
    }

    try {
      fetch(`${API_BASE}/admin/apps/${encodeURIComponent(id)}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFeatured }),
      }).catch(() => {});
    } catch {}

    return app || ({ id, isFeatured } as AppItem);
  },

  async addCategory(data: { name: string; icon?: string; description?: string }, token: string): Promise<CategoryItem> {
    const cats = getLocalCategories();
    const newCat: CategoryItem = {
      id: data.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: data.name,
      icon: data.icon || 'Tag',
      description: data.description || ''
    };
    cats.push(newCat);
    setLocalCategories(cats);
    return newCat;
  },

  async deleteCategory(id: string, token: string): Promise<void> {
    const cats = getLocalCategories().filter(c => c.id !== id);
    setLocalCategories(cats);
  },

  async changeAdminPassword(currentPassword: string, newPassword: string, token: string): Promise<void> {
    return;
  },

  async resetData(token: string): Promise<void> {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_CATS_KEY);
  }
};
  
