import { upload } from '@vercel/blob/client';
import type { AppItem, CategoryItem, StoreStats, AdminAuthResponse } from '../types.ts';

const API_BASE = '/api';

export const api = {
  // Direct Client-to-Vercel Blob Upload
  async uploadFile(file: File, token: string, onProgress?: (percent: number) => void): Promise<{ url: string; pathname: string; contentType: string }> {
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
  },

  // Visitor Public Endpoints
  async getApps(params?: { q?: string; category?: string; sort?: string; featured?: boolean }): Promise<AppItem[]> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.featured) query.set('featured', 'true');

    const res = await fetch(`${API_BASE}/apps?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch apps');
    const json = await res.json();
    return json.data || [];
  },

  async getAppById(id: string): Promise<AppItem> {
    const res = await fetch(`${API_BASE}/apps/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch app details');
    }
    const json = await res.json();
    return json.data;
  },

  async getCategories(): Promise<CategoryItem[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const json = await res.json();
    return json.data || [];
  },

  async getStats(): Promise<StoreStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch store statistics');
    const json = await res.json();
    return json.data;
  },

  async recordDownload(id: string): Promise<{ downloadsCount: number; apkUrl: string }> {
    const res = await fetch(`${API_BASE}/apps/${encodeURIComponent(id)}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to process download request');
    }
    const json = await res.json();
    return json.data;
  },

  async rateApp(id: string, rating: number): Promise<{ rating: number; ratingCount: number }> {
    const res = await fetch(`${API_BASE}/apps/${encodeURIComponent(id)}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit rating');
    }
    const json = await res.json();
    return json.data;
  },

  // Admin Authentication
  async adminLogin(password: string, username = 'admin'): Promise<AdminAuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, username }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Invalid admin credentials');
    }
    return json;
  },

  async verifyAdminToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return !!json.authenticated;
    } catch {
      return false;
    }
  },

  // Protected Admin Mutations
  async createApp(appData: Partial<AppItem>, token: string): Promise<AppItem> {
    const res = await fetch(`${API_BASE}/admin/apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(appData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to publish app');
    }
    return json.data;
  },

  async updateApp(id: string, appData: Partial<AppItem>, token: string): Promise<AppItem> {
    const res = await fetch(`${API_BASE}/admin/apps/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(appData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update app');
    }
    return json.data;
  },

  async deleteApp(id: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/apps/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete app');
    }
  },

  async toggleFeatured(id: string, isFeatured: boolean, token: string): Promise<AppItem> {
    const res = await fetch(`${API_BASE}/admin/apps/${encodeURIComponent(id)}/featured`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isFeatured }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update featured status');
    }
    return json.data;
  },

  async addCategory(data: { name: string; icon?: string; description?: string }, token: string): Promise<CategoryItem> {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to add category');
    }
    return json.data;
  },

  async deleteCategory(id: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete category');
    }
  },

  async changeAdminPassword(currentPassword: string, newPassword: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to change password');
    }
  },

  async resetData(token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/reset-data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to reset store data');
    }
  }
};
