import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { AppItem, CategoryItem, StoreStats } from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const AUTH_SECRET = process.env.ADMIN_SECRET_KEY || 'mabs-store-super-secret-key-2026-xyz';

interface StoreData {
  admin: {
    username: string;
    passwordHash: string;
    salt: string;
    lastUpdated: string;
  };
  categories: CategoryItem[];
  apps: AppItem[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'ai', name: '🤖 AI', icon: 'Bot', description: 'Artificial intelligence assistants and smart utilities' },
  { id: 'games', name: '🎮 Games', icon: 'Gamepad2', description: 'Action, strategy, casual and arcade games' },
  { id: 'education', name: '📚 Education', icon: 'GraduationCap', description: 'Learning platforms, reference guides and courses' },
  { id: 'utilities', name: '🛠️ Utilities', icon: 'Wrench', description: 'System tools, file managers, diagnostic and performance apps' },
  { id: 'entertainment', name: '🎬 Entertainment', icon: 'Film', description: 'Media players, streaming, podcasts and creative audio' },
  { id: 'social', name: '📱 Social', icon: 'MessageSquare', description: 'Communication, messaging and social platforms' },
  { id: 'productivity', name: '💼 Productivity', icon: 'Briefcase', description: 'Task managers, notes, office suites and scanners' },
  { id: 'other', name: '🌐 Other', icon: 'Globe', description: 'Specialty tools, lifestyle and experimental applications' },
];

const INITIAL_APPS: AppItem[] = [];

class DatabaseService {
  private data: StoreData;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const initialSalt = crypto.randomBytes(16).toString('hex');
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin';
      const initialPasswordHash = hashPassword(defaultPassword, initialSalt);

      this.data = {
        admin: {
          username: 'admin',
          passwordHash: initialPasswordHash,
          salt: initialSalt,
          lastUpdated: new Date().toISOString(),
        },
        categories: DEFAULT_CATEGORIES,
        apps: INITIAL_APPS,
      };
      this.saveToFile();
    } else {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Guarantee categories exist
        if (!this.data.categories || this.data.categories.length === 0) {
          this.data.categories = DEFAULT_CATEGORIES;
          this.saveToFile();
        }
        // Ensure test app exists if missing
        if (!this.data.apps || this.data.apps.length === 0) {
          this.data.apps = INITIAL_APPS;
          this.saveToFile();
        }
      } catch (err) {
        console.error('Error loading store.json, re-initializing default data', err);
        const initialSalt = crypto.randomBytes(16).toString('hex');
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin';
        this.data = {
          admin: {
            username: 'admin',
            passwordHash: hashPassword(defaultPassword, initialSalt),
            salt: initialSalt,
            lastUpdated: new Date().toISOString(),
          },
          categories: DEFAULT_CATEGORIES,
          apps: INITIAL_APPS,
        };
        this.saveToFile();
      }
    }
  }

  private saveToFile() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store database to disk:', err);
    }
  }

  // --- Auth & Admin verification ---
  public verifyAdminPassword(password: string): boolean {
    if (!password) return false;
    const computed = hashPassword(password, this.data.admin.salt);
    return computed === this.data.admin.passwordHash;
  }

  public changeAdminPassword(newPassword: string): boolean {
    if (!newPassword || newPassword.length < 4) return false;
    const newSalt = crypto.randomBytes(16).toString('hex');
    this.data.admin.salt = newSalt;
    this.data.admin.passwordHash = hashPassword(newPassword, newSalt);
    this.data.admin.lastUpdated = new Date().toISOString();
    this.saveToFile();
    return true;
  }

  public generateToken(username: string): string {
    const payload = {
      user: username,
      role: 'admin',
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
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
  public getApps(query?: { q?: string; category?: string; sort?: string; featured?: boolean }): AppItem[] {
    let result = [...this.data.apps];

    if (query?.category && query.category.toLowerCase() !== 'all') {
      const catLower = query.category.toLowerCase().trim();
      result = result.filter(app => 
        app.category.toLowerCase().includes(catLower) || 
        catLower.includes(app.category.toLowerCase())
      );
    }

    if (query?.featured) {
      result = result.filter(app => app.isFeatured);
    }

    if (query?.q && query.q.trim() !== '') {
      const searchTerms = query.q.toLowerCase().trim().split(/\s+/);
      result = result.filter(app => {
        const text = `${app.name} ${app.developer} ${app.category} ${app.shortDescription} ${app.fullDescription} ${app.packageName || ''}`.toLowerCase();
        return searchTerms.every(term => text.includes(term));
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

  public getAppById(id: string): AppItem | null {
    return this.data.apps.find(a => a.id === id) || null;
  }

  // --- Apps Mutations (Admin only) ---
  public createApp(appInput: Partial<AppItem>): AppItem {
    const id = appInput.id || appInput.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `app-${Date.now()}`;
    
    // Ensure unique ID
    let finalId = id;
    let counter = 1;
    while (this.data.apps.some(a => a.id === finalId)) {
      finalId = `${id}-${counter++}`;
    }

    const now = new Date().toISOString().split('T')[0];
    const newApp: AppItem = {
      id: finalId,
      name: (appInput.name || 'Untitled App').trim(),
      developer: (appInput.developer || 'Developer').trim(),
      iconUrl: (appInput.iconUrl || '').trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80',
      shortDescription: (appInput.shortDescription || '').trim(),
      fullDescription: (appInput.fullDescription || appInput.shortDescription || '').trim(),
      category: (appInput.category || 'Other').trim(),
      version: (appInput.version || '1.0.0').trim(),
      appSize: (appInput.appSize || '25 MB').trim(),
      apkUrl: (appInput.apkUrl || '').trim(),
      screenshots: Array.isArray(appInput.screenshots) && appInput.screenshots.length > 0 
        ? appInput.screenshots.filter(s => typeof s === 'string' && s.trim().length > 0)
        : [appInput.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'],
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
    this.saveToFile();
    return newApp;
  }

  public updateApp(id: string, updates: Partial<AppItem>): AppItem | null {
    const index = this.data.apps.findIndex(a => a.id === id);
    if (index === -1) return null;

    const existing = this.data.apps[index];
    const updated: AppItem = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      updatedAt: new Date().toISOString().split('T')[0],
      screenshots: Array.isArray(updates.screenshots) 
        ? updates.screenshots.filter(s => typeof s === 'string' && s.trim().length > 0) 
        : existing.screenshots,
    };

    this.data.apps[index] = updated;
    this.saveToFile();
    return updated;
  }

  public deleteApp(id: string): boolean {
    const initialLen = this.data.apps.length;
    this.data.apps = this.data.apps.filter(a => a.id !== id);
    if (this.data.apps.length !== initialLen) {
      this.saveToFile();
      return true;
    }
    return false;
  }

  public toggleFeatured(id: string, isFeatured?: boolean): AppItem | null {
    const app = this.data.apps.find(a => a.id === id);
    if (!app) return null;
    app.isFeatured = isFeatured !== undefined ? isFeatured : !app.isFeatured;
    app.updatedAt = new Date().toISOString().split('T')[0];
    this.saveToFile();
    return app;
  }

  // --- Visitor Actions ---
  public recordDownload(id: string): { downloadsCount: number; apkUrl: string } | null {
    const app = this.data.apps.find(a => a.id === id);
    if (!app) return null;
    app.downloadsCount = (app.downloadsCount || 0) + 1;
    this.saveToFile();
    return {
      downloadsCount: app.downloadsCount,
      apkUrl: app.apkUrl,
    };
  }

  public rateApp(id: string, userRating: number): { rating: number; ratingCount: number } | null {
    const app = this.data.apps.find(a => a.id === id);
    if (!app) return null;
    const clamped = Math.max(1, Math.min(5, Number(userRating) || 5));
    const totalScore = (app.rating * app.ratingCount) + clamped;
    app.ratingCount = (app.ratingCount || 0) + 1;
    app.rating = Number((totalScore / app.ratingCount).toFixed(1));
    this.saveToFile();
    return {
      rating: app.rating,
      ratingCount: app.ratingCount,
    };
  }

  // --- Categories Management ---
  public getCategories(): CategoryItem[] {
    return this.data.categories;
  }

  public addCategory(name: string, icon = 'AppWindow', description = ''): CategoryItem {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = this.data.categories.find(c => c.id === id || c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const newCategory: CategoryItem = {
      id,
      name,
      icon,
      description
    };
    this.data.categories.push(newCategory);
    this.saveToFile();
    return newCategory;
  }

  public deleteCategory(id: string): boolean {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    if (this.data.categories.length !== initialLen) {
      this.saveToFile();
      return true;
    }
    return false;
  }

  // --- Store Stats ---
  public getStats(): StoreStats {
    const totalApps = this.data.apps.length;
    const totalDownloads = this.data.apps.reduce((acc, a) => acc + (a.downloadsCount || 0), 0);
    const totalCategories = this.data.categories.length;
    const featuredCount = this.data.apps.filter(a => a.isFeatured).length;

    return {
      totalApps,
      totalDownloads,
      totalCategories,
      featuredCount,
    };
  }

  public resetToDefaults() {
    const initialSalt = crypto.randomBytes(16).toString('hex');
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin';
    this.data = {
      admin: {
        username: 'admin',
        passwordHash: hashPassword(defaultPassword, initialSalt),
        salt: initialSalt,
        lastUpdated: new Date().toISOString(),
      },
      categories: DEFAULT_CATEGORIES,
      apps: INITIAL_APPS,
    };
    this.saveToFile();
  }
}

export const db = new DatabaseService();
