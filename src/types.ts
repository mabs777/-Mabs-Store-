export interface AppItem {
  id: string;
  name: string;
  developer: string;
  iconUrl: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  version: string;
  appSize: string;
  apkUrl: string;
  screenshots: string[];
  whatsNew: string;
  releaseDate: string;
  updatedAt: string;
  isFeatured: boolean;
  isTrending: boolean;
  downloadsCount: number;
  rating: number;
  ratingCount: number;
  minAndroidVersion?: string;
  packageName?: string;
  featuredTag?: string;
  tags?: string[];
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface StoreStats {
  totalApps: number;
  totalDownloads: number;
  totalCategories: number;
  featuredCount: number;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  username?: string;
  role?: 'admin';
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type SortOption = 'trending' | 'latest' | 'popular' | 'rating' | 'name';
