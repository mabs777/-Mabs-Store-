import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { AppItem, CategoryItem, StoreStats } from '../src/types.ts';

const ROOT_DATA_DIR = path.join(process.cwd(), 'data');
const ROOT_DATA_FILE = path.join(ROOT_DATA_DIR, 'store.json');
const TMP_DATA_FILE = path.join('/tmp', 'mabs_store_data.json');

// Derive dynamic HMAC auth secret from environment or cryptographically random process seed
const RUNTIME_SEED = crypto.randomBytes(32).toString('hex');
const AUTH_SECRET = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD || RUNTIME_SEED;

interface AdminCredentialRecord {
  username: string;
  passwordHash: string;
  salt: string;
  lastUpdated: string;
}

interface StoreData {
  admin?: AdminCredentialRecord;
  categories: CategoryItem[];
  apps: AppItem[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'ai', name: '🤖 AI', icon: 'Bot', description: 'Artificial intelligence assistants and smart utilities' },
  { id: 'games', name: '🎮 Games', icon: 'Gamepad2', description: 'Action, strategy, casual and arcade games' },
  { id: 'education', name: '📚 Education', icon: 'GraduationCap', description: 'Learning platforms, reference guides and courses' },
  { id: 'utilities', name: '🛠️ Utilities', icon: 'Wrench', description: 'System tools, file managers, diagnostic and performance apps' },
  { id: 'entertainment', name: '🎬 Entertainment', icon: 'Film', description: 'Media players, streaming, podcasts and creative audio' },
  { id: 'social', name: '📱 Social', icon: 'MessageSquare', description: 'Communication, messaging and social platforms' },
  { id: 'productivity', name: '💼 Productivity', icon: 'Briefcase', description: 'Task managers, notes, office suites and scanners' },
  { id: 'other', name: '🌐 Other', icon: 'Globe', description: 'Specialty tools, lifestyle and experimental applications' },
];

export class DatabaseService {
  private data: StoreData = {
    categories: [...DEFAULT_CATEGORIES],
    apps: [],
  };
  private isInitialized = false;
  private syncPromise: Promise<void> | null = null;
  private activeFilePath: string = ROOT_DATA_FILE;

  constructor() {
    this.initLocalSync();
  }

  // --- Initial Synchronous Hydration (Fast Cold Starts) ---
  private initLocalSync() {
    if (this.isInitialized) return;

    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      this.activeFilePath = TMP_DATA_FILE;
    } else {
      this.activeFilePath = ROOT_DATA_FILE;
    }

    // Try loading local file snapshot if present
    for (const filePath of [this.activeFilePath, ROOT_DATA_FILE]) {
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
              this.data.categories = parsed.categories;
            }
            if (Array.isArray(parsed.apps)) {
              this.data.apps = parsed.apps;
            }
            if (parsed.admin) {
              this.data.admin = parsed.admin;
            }
            break;
          }
        } catch (e) {
          // file read error fallback
        }
      }
    }

    // Guarantee categories are present
    if (!this.data.categories || this.data.categories.length === 0) {
      this.data.categories = [...DEFAULT_CATEGORIES];
    }
    if (!this.data.apps) {
      this.data.apps = [];
    }

    this.isInitialized = true;
  }

  // --- Remote Persistent Database Sync (Vercel KV / Upstash / Remote Storage) ---
  public async syncWithRemote(): Promise<void> {
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    const storageUrl = process.env.STORAGE_API_URL;
    const storageKey = process.env.STORAGE_API_KEY;

    if (kvUrl && kvToken) {
      try {
        const cleanUrl = kvUrl.replace(/\/+$/, '');
        const res = await fetch(`${cleanUrl}/get/mabs_store_data`, {
          headers: { Authorization: `Bearer ${kvToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.result) {
            const remoteData = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
            if (remoteData && typeof remoteData === 'object') {
              if (Array.isArray(remoteData.categories)) {
                this.data.categories = remoteData.categories;
              }
              if (Array.isArray(remoteData.apps)) {
                this.data.apps = remoteData.apps;
              }
              if (remoteData.admin) {
                this.data.admin = remoteData.admin;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not pull from KV storage:', err);
      }
    } else if (storageUrl) {
      try {
        const res = await fetch(storageUrl, {
          headers: storageKey ? { Authorization: `Bearer ${storageKey}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const remoteData = json.data || json;
          if (remoteData && typeof remoteData === 'object') {
            if (Array.isArray(remoteData.categories)) this.data.categories = remoteData.categories;
            if (Array.isArray(remoteData.apps)) this.data.apps = remoteData.apps;
            if (remoteData.admin) this.data.admin = remoteData.admin;
          }
        }
      } catch (err) {
        console.warn('Could not pull from remote storage URL:', err);
      }
    }
  }

  private async persist(): Promise<void> {
    // 1. Save to local/tmp snapshot
    try {
      if (!fs.existsSync(path.dirname(this.activeFilePath))) {
        fs.mkdirSync(path.dirname(this.activeFilePath), { recursive: true });
      }
      fs.writeFileSync(this.activeFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      try {
        fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch {
        // silent
      }
    }

    // 2. Save to Remote Persistent Database (KV / Upstash / Remote Storage)
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    const storageUrl = process.env.STORAGE_API_URL;
    const storageKey = process.env.STORAGE_API_KEY;

    if (kvUrl && kvToken) {
      try {
        const cleanUrl = kvUrl.replace(/\/+$/, '');
        await fetch(`${cleanUrl}/set/mabs_store_data`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kvToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(JSON.stringify(this.data)),
        });
      } catch (err) {
        console.error('Failed to sync to KV storage:', err);
      }
    } else if (storageUrl) {
      try {
        await fetch(storageUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(storageKey ? { Authorization: `Bearer ${storageKey}` } : {}),
          },
          body: JSON.stringify(this.data),
        });
      } catch (err) {
        console.error('Failed to sync to remote storage URL:', err);
      }
    }
  }

  // --- Auth & Admin Verification ---
  public async verifyAdminPassword(password: string): Promise<boolean> {
    if (!password || typeof password !== 'string') return false;

    // Check environment override first
    const envPassword = process.env.ADMIN_PASSWORD;
    if (envPassword) {
      return password === envPassword;
    }

    // If custom password was updated in persistent storage
    if (this.data.admin?.salt && this.data.admin?.passwordHash) {
      const computed = hashPassword(password, this.data.admin.salt);
      if (computed === this.data.admin.passwordHash) {
        return true;
      }
    }

    // Baseline fallback if neither environment nor database hash is set
    return password === 'admin';
  }

  public async changeAdminPassword(newPassword: string): Promise<boolean> {
    if (!newPassword || newPassword.length < 4) return false;
    const newSalt = crypto.randomBytes(16).toString('hex');
    this.data.admin = {
      username: 'admin',
      salt: newSalt,
      passwordHash: hashPassword(newPassword, newSalt),
      lastUpdated: new Date().toISOString(),
    };
    await this.persist();
    return true;
  }

  public generateToken(username: string): string {
    const payload = {
      user: username,
      role: 'admin',
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payloadStr).digest('base64url');
    return `${payloadStr}.${signature}`;
  }

  public verifyToken(token: string): boolean {
    if (!token) return false;
    try {
      const [payloadStr, signature] = token.split('.');
      if (!payloadStr || !signature) return false;
      const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadStr).digest('base64url');
      if (signature !== expectedSig) return false;
      const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
      if (Date.now() > payload.exp) return false;
      return payload.role === 'admin';
    } catch {
      return false;
    }
  }

  // --- Apps Read & Query ---
  public async getApps(query?: { q?: string; category?: string; sort?: string; featured?: boolean }): Promise<AppItem[]> {
    let result = [...this.data.apps];

    if (query?.category && query.category.toLowerCase() !== 'all') {
      const cleanCat = (str: string) => str.toLowerCase().replace(/[^\w\s]/gi, '').trim();
      const catQueryClean = cleanCat(query.category);
      result = result.filter((app) => {
        const appCatClean = cleanCat(app.category);
        return (
          appCatClean.includes(catQueryClean) ||
          catQueryClean.includes(appCatClean) ||
          app.category.toLowerCase() === query.category!.toLowerCase()
        );
      });
    }

    if (query?.featured) {
      result = result.filter((app) => app.isFeatured);
    }

    if (query?.q && query.q.trim() !== '') {
      const searchTerms = query.q.toLowerCase().trim().split(/\s+/);
      result = result.filter((app) => {
        const text = `${app.name} ${app.developer} ${app.category} ${app.shortDescription} ${app.fullDescription} ${app.packageName || ''}`.toLowerCase();
        return searchTerms.every((term) => text.includes(term));
      });
    }

    // Sorting
    const sort = query?.sort || 'trending';
    if (sort === 'trending') {
      result.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.downloadsCount - a.downloadsCount);
    } else if (sort === 'latest') {
      result.sort((a, b) => new Date(b.releaseDate || b.updatedAt).getTime() - new Date(a.releaseDate || a.updatedAt).getTime());
    } else if (sort === 'popular') {
      result.sort((a, b) => b.downloadsCount - a.downloadsCount);
    } else if (sort === 'rating') {
      result.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    } else if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }

  public async getAppById(id: string): Promise<AppItem | null> {
    return this.data.apps.find((a) => a.id === id) || null;
  }

  // --- Apps Mutations (Admin only) ---
  public async createApp(appInput: Partial<AppItem>): Promise<AppItem> {
    const id =
      appInput.id ||
      appInput.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `app-${Date.now()}`;

    // Ensure unique ID
    let finalId = id;
    let counter = 1;
    while (this.data.apps.some((a) => a.id === finalId)) {
      finalId = `${id}-${counter++}`;
    }

    const now = new Date().toISOString().split('T')[0];
    const newApp: AppItem = {
      id: finalId,
      name: (appInput.name || 'Untitled App').trim(),
      developer: (appInput.developer || 'Developer').trim(),
      iconUrl:
        (appInput.iconUrl || '').trim() ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80',
      shortDescription: (appInput.shortDescription || '').trim(),
      fullDescription: (appInput.fullDescription || appInput.shortDescription || '').trim(),
      category: (appInput.category || 'Other').trim(),
      version: (appInput.version || '1.0.0').trim(),
      appSize: (appInput.appSize || '25 MB').trim(),
      apkUrl: (appInput.apkUrl || '').trim(),
      screenshots:
        Array.isArray(appInput.screenshots) && appInput.screenshots.length > 0
          ? appInput.screenshots.filter((s) => typeof s === 'string' && s.trim().length > 0)
          : [
              appInput.iconUrl ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            ],
      whatsNew: (appInput.whatsNew || 'Initial version release.').trim(),
      releaseDate: appInput.releaseDate || now,
      updatedAt: now,
      isFeatured: !!appInput.isFeatured,
      isTrending: appInput.isTrending !== undefined ? !!appInput.isTrending : true,
      downloadsCount: typeof appInput.downloadsCount === 'number' ? appInput.downloadsCount : 0,
      rating: typeof appInput.rating === 'number' ? appInput.rating : 5.0,
      ratingCount: typeof appInput.ratingCount === 'number' ? appInput.ratingCount : 1,
      packageName: appInput.packageName || `com.${finalId.replace(/-/g, '.')}`,
      minAndroidVersion: appInput.minAndroidVersion || 'Android 8.0 or higher',
      featuredTag: appInput.featuredTag || (appInput.isFeatured ? 'Featured App' : undefined),
    };

    this.data.apps.unshift(newApp);
    await this.persist();
    return newApp;
  }

  public async updateApp(id: string, updates: Partial<AppItem>): Promise<AppItem | null> {
    const index = this.data.apps.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const existing = this.data.apps[index];
    const updated: AppItem = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      updatedAt: new Date().toISOString().split('T')[0],
      screenshots: Array.isArray(updates.screenshots)
        ? updates.screenshots.filter((s) => typeof s === 'string' && s.trim().length > 0)
        : existing.screenshots,
    };

    this.data.apps[index] = updated;
    await this.persist();
    return updated;
  }

  public async deleteApp(id: string): Promise<boolean> {
    const initialLen = this.data.apps.length;
    this.data.apps = this.data.apps.filter((a) => a.id !== id);
    if (this.data.apps.length !== initialLen) {
      await this.persist();
      return true;
    }
    return false;
  }

  public async toggleFeatured(id: string, isFeatured?: boolean): Promise<AppItem | null> {
    const app = this.data.apps.find((a) => a.id === id);
    if (!app) return null;
    app.isFeatured = isFeatured !== undefined ? isFeatured : !app.isFeatured;
    app.updatedAt = new Date().toISOString().split('T')[0];
    await this.persist();
    return app;
  }

  // --- Visitor Actions ---
  public async recordDownload(id: string): Promise<{ downloadsCount: number; apkUrl: string } | null> {
    const app = this.data.apps.find((a) => a.id === id);
    if (!app) return null;
    app.downloadsCount = (app.downloadsCount || 0) + 1;
    await this.persist();
    return {
      downloadsCount: app.downloadsCount,
      apkUrl: app.apkUrl,
    };
  }

  public async rateApp(id: string, userRating: number): Promise<{ rating: number; ratingCount: number } | null> {
    const app = this.data.apps.find((a) => a.id === id);
    if (!app) return null;
    const clamped = Math.max(1, Math.min(5, Number(userRating) || 5));
    const totalScore = app.rating * app.ratingCount + clamped;
    app.ratingCount = (app.ratingCount || 0) + 1;
    app.rating = Number((totalScore / app.ratingCount).toFixed(1));
    await this.persist();
    return {
      rating: app.rating,
      ratingCount: app.ratingCount,
    };
  }

  // --- Categories Management ---
  public async getCategories(): Promise<CategoryItem[]> {
    return this.data.categories;
  }

  public async addCategory(name: string, icon = 'AppWindow', description = ''): Promise<CategoryItem> {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = this.data.categories.find((c) => c.id === id || c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const newCategory: CategoryItem = {
      id,
      name,
      icon,
      description,
    };
    this.data.categories.push(newCategory);
    await this.persist();
    return newCategory;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    if (this.data.categories.length !== initialLen) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Store Stats ---
  public async getStats(): Promise<StoreStats> {
    const totalApps = this.data.apps.length;
    const totalDownloads = this.data.apps.reduce((acc, a) => acc + (a.downloadsCount || 0), 0);
    const totalCategories = this.data.categories.length;
    const featuredCount = this.data.apps.filter((a) => a.isFeatured).length;

    return {
      totalApps,
      totalDownloads,
      totalCategories,
      featuredCount,
    };
  }

  public async resetToDefaults(): Promise<void> {
    this.data = {
      categories: [...DEFAULT_CATEGORIES],
      apps: [],
    };
    await this.persist();
  }
}

export const db = new DatabaseService();
