import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Rocket, 
  Search, 
  Sparkles, 
  Flame, 
  Clock, 
  Star, 
  Download, 
  Tag, 
  Filter, 
  ArrowUpDown, 
  PlusCircle, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  X,
  ExternalLink,
  ChevronRight,
  Zap,
  Smartphone
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './components/Toast.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AppCard } from './components/AppCard.tsx';
import { AppDetailsModal } from './components/AppDetailsModal.tsx';
import { AppFormModal } from './components/AppFormModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { CategoryManagerModal } from './components/CategoryManagerModal.tsx';
import { PasswordChangeModal } from './components/PasswordChangeModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { FeaturedCarousel } from './components/FeaturedCarousel.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { api } from './services/api.ts';
import type { AppItem, CategoryItem, StoreStats, SortOption } from './types.ts';

function StoreApp() {
  const { isAdmin, token, openLoginModal } = useAuth();
  const { showToast } = useToast();

  // App data state
  const [apps, setApps] = useState<AppItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('trending');

  // Navigation & View state
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mabs_theme') !== 'light';
  });

  // Track admin login/logout transitions to automatically switch views
  const prevAdminRef = React.useRef(isAdmin);
  useEffect(() => {
    if (!prevAdminRef.current && isAdmin) {
      setCurrentView('admin');
    } else if (prevAdminRef.current && !isAdmin) {
      setCurrentView('store');
    }
    prevAdminRef.current = isAdmin;
  }, [isAdmin]);

  // Modal states
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState<AppItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<AppItem | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Sync theme with DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mabs_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mabs_theme', 'light');
    }
  }, [darkMode]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [appsData, catsData, statsData] = await Promise.all([
        api.getApps(),
        api.getCategories(),
        api.getStats().catch(() => null),
      ]);

      setApps(appsData);
      setCategories(catsData);
      if (statsData) setStats(statsData);

      // Check URL query param for deep linked app (e.g. ?app=some-id)
      const urlParams = new URLSearchParams(window.location.search);
      const deepAppId = urlParams.get('app');
      if (deepAppId && appsData.length > 0) {
        const found = appsData.find((a) => a.id === deepAppId);
        if (found) setSelectedApp(found);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load store data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle URL deep link state update
  useEffect(() => {
    if (selectedApp) {
      const url = new URL(window.location.href);
      url.searchParams.set('app', selectedApp.id);
      window.history.replaceState({}, '', url.toString());
    } else {
      const url = new URL(window.location.href);
      if (url.searchParams.has('app')) {
        url.searchParams.delete('app');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [selectedApp]);

  // Filtered & Sorted Apps calculation
  const filteredApps = useMemo(() => {
    let result = [...apps];

    // Filter by category
    if (activeCategory !== 'all') {
      const cleanCat = (str: string) => str.toLowerCase().replace(/[^\w\s]/gi, '').trim();
      const catQueryClean = cleanCat(activeCategory);
      result = result.filter((app) => {
        const appCatClean = cleanCat(app.category);
        return (
          appCatClean.includes(catQueryClean) ||
          catQueryClean.includes(appCatClean) ||
          app.category.toLowerCase() === activeCategory.toLowerCase()
        );
      });
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/);
      result = result.filter((app) => {
        const fullText = `${app.name} ${app.developer} ${app.category} ${app.shortDescription} ${app.fullDescription} ${app.packageName || ''}`.toLowerCase();
        return terms.every((t) => fullText.includes(t));
      });
    }

    // Sort
    if (activeSort === 'trending') {
      result.sort(
        (a, b) =>
          (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) ||
          b.downloadsCount - a.downloadsCount
      );
    } else if (activeSort === 'latest') {
      result.sort(
        (a, b) =>
          new Date(b.releaseDate || b.updatedAt).getTime() -
          new Date(a.releaseDate || a.updatedAt).getTime()
      );
    } else if (activeSort === 'popular') {
      result.sort((a, b) => b.downloadsCount - a.downloadsCount);
    } else if (activeSort === 'rating') {
      result.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    } else if (activeSort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [apps, activeCategory, searchQuery, activeSort]);

  // Featured apps for hero banner
  const featuredApps = useMemo(() => {
    return apps.filter((a) => a.isFeatured);
  }, [apps]);

  // Trending apps
  const trendingApps = useMemo(() => {
    return apps.filter((a) => a.isTrending || a.downloadsCount > 1000).slice(0, 6);
  }, [apps]);

  // Latest releases
  const latestApps = useMemo(() => {
    return [...apps]
      .sort(
        (a, b) =>
          new Date(b.releaseDate || b.updatedAt).getTime() -
          new Date(a.releaseDate || a.updatedAt).getTime()
      )
      .slice(0, 6);
  }, [apps]);

  // App mutation handlers
  const handleOpenAddApp = () => {
    setAppToEdit(null);
    setIsAppFormOpen(true);
  };

  const handleEditApp = (app: AppItem) => {
    setAppToEdit(app);
    setIsAppFormOpen(true);
  };

  const handleDeleteApp = (app: AppItem) => {
    setAppToDelete(app);
    setIsDeleteModalOpen(true);
  };

  const handleToggleFeatured = async (app: AppItem) => {
    if (!token) return;
    try {
      const updated = await api.toggleFeatured(app.id, !app.isFeatured, token);
      setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast({
        type: 'success',
        title: updated.isFeatured ? 'App Featured' : 'App Unfeatured',
        description: `"${updated.name}" featured status updated.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        description: err.message || 'Could not toggle featured status.',
      });
    }
  };

  const handleAppSaved = (savedApp: AppItem, isEdit: boolean) => {
    if (isEdit) {
      setApps((prev) => prev.map((a) => (a.id === savedApp.id ? savedApp : a)));
      if (selectedApp?.id === savedApp.id) {
        setSelectedApp(savedApp);
      }
    } else {
      setApps((prev) => [savedApp, ...prev]);
    }
  };

  const handleAppDeleted = (appId: string) => {
    setApps((prev) => prev.filter((a) => a.id !== appId));
    if (selectedApp?.id === appId) {
      setSelectedApp(null);
    }
  };

  const handleDownloadCompleted = (appId: string, newDownloadsCount: number) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, downloadsCount: newDownloadsCount } : a))
    );
    if (selectedApp?.id === appId) {
      setSelectedApp((prev) => (prev ? { ...prev, downloadsCount: newDownloadsCount } : null));
    }
  };

  const handleCategoryAdded = (newCat: CategoryItem) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleCategoryDeleted = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  const isFiltering = activeCategory !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Bar */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenAddApp={handleOpenAddApp}
        onOpenAdminDashboard={() => setCurrentView('admin')}
        currentView={currentView}
        onNavigate={setCurrentView}
        stats={stats}
      />

      {/* Main Content View Container */}
      <main className="flex-1">
        {currentView === 'admin' && isAdmin ? (
          /* =================================================== */
          /* ADMIN DASHBOARD VIEW                                */
          /* =================================================== */
          <AdminDashboard
            apps={apps}
            categories={categories}
            stats={stats}
            onOpenAddApp={handleOpenAddApp}
            onEditApp={handleEditApp}
            onDeleteApp={handleDeleteApp}
            onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
            onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
            onRefreshData={loadData}
            onNavigateToStore={() => setCurrentView('store')}
            onToggleFeatured={handleToggleFeatured}
          />
        ) : (
          /* =================================================== */
          /* PUBLIC STOREFRONT VIEW                              */
          /* =================================================== */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
            {/* Loading Skeleton */}
            {isLoading && (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-slate-300">Loading 🚀 Mabs Store ⚡ APKs...</p>
              </div>
            )}

            {/* Error Message with retry */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-center max-w-lg mx-auto">
                <p className="text-sm font-semibold">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Loading</span>
                </button>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {/* 1. Featured Hero Carousel (Only shown when not actively filtering by category/search and featured apps exist) */}
                {!isFiltering && featuredApps.length > 0 && (
                  <FeaturedCarousel
                    apps={featuredApps}
                    onSelectApp={setSelectedApp}
                    onDownloadCompleted={handleDownloadCompleted}
                  />
                )}

                {/* 2. Category Navigation Bar (Pills) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Browse Categories</span>
                    </h2>
                    {activeCategory !== 'all' && (
                      <button
                        onClick={() => setActiveCategory('all')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        Reset to All
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                      id="cat-pill-all"
                      onClick={() => setActiveCategory('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        activeCategory === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 border border-slate-800'
                      }`}
                    >
                      <span>⚡ All Applications</span>
                    </button>

                    {categories.map((cat) => {
                      const isSelected =
                        activeCategory.toLowerCase() === cat.name.toLowerCase() ||
                        activeCategory.toLowerCase() === cat.id.toLowerCase();
                      return (
                        <button
                          key={cat.id}
                          id={`cat-pill-${cat.id}`}
                          onClick={() => setActiveCategory(cat.name)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 border border-slate-800'
                          }`}
                        >
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Filter / Search Status & Sorting Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="font-bold text-slate-100 text-sm">
                      {isFiltering ? 'Search & Filter Results' : 'All Android APKs'}
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-slate-700">
                      {filteredApps.length} {filteredApps.length === 1 ? 'App' : 'Apps'}
                    </span>
                    {searchQuery && (
                      <span className="text-slate-400">
                        for <strong className="text-amber-400">"{searchQuery}"</strong>
                      </span>
                    )}
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
                    <select
                      id="sort-select"
                      value={activeSort}
                      onChange={(e) => setActiveSort(e.target.value as SortOption)}
                      className="bg-slate-900 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      <option value="trending">🔥 Trending First</option>
                      <option value="latest">🆕 Latest Releases</option>
                      <option value="popular">⬇️ Most Downloaded</option>
                      <option value="rating">⭐ Highest Rated</option>
                      <option value="name">🔤 Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* 4. App Cards Grid / Empty States */}
                {apps.length === 0 ? (
                  /* Store is completely clean & empty */
                  <EmptyState
                    type="catalog-empty"
                    onOpenAddApp={handleOpenAddApp}
                  />
                ) : filteredApps.length === 0 ? (
                  /* Search / Filter returned no apps */
                  <EmptyState
                    type="search-empty"
                    searchQuery={searchQuery || activeCategory}
                    onResetSearch={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                  />
                ) : (
                  /* Render App Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {filteredApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        onSelect={setSelectedApp}
                        onEdit={handleEditApp}
                        onDelete={handleDeleteApp}
                        onToggleFeatured={handleToggleFeatured}
                        onDownloadCompleted={handleDownloadCompleted}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/90 py-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Rocket className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-slate-200 text-sm font-['Outfit',sans-serif]">
                🚀 Mabs Store ⚡
              </span>
              <span className="block text-[11px] text-slate-500">
                Independent Android APK Marketplace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Direct & Verified APKs
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              High Speed CDN
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} Mabs Store. All rights reserved.
          </div>
        </div>
      </footer>

      {/* =================================================== */}
      {/* MODALS & OVERLAYS                                   */}
      {/* =================================================== */}

      {/* App Details Modal */}
      <AppDetailsModal
        app={selectedApp}
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        onEdit={handleEditApp}
        onDelete={handleDeleteApp}
        onToggleFeatured={handleToggleFeatured}
        onAppUpdated={(updated) => {
          setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setSelectedApp(updated);
        }}
      />

      {/* Add / Edit App Modal */}
      <AppFormModal
        isOpen={isAppFormOpen}
        onClose={() => setIsAppFormOpen(false)}
        appToEdit={appToEdit}
        categories={categories}
        onSuccess={handleAppSaved}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        app={appToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={handleAppDeleted}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onCategoryAdded={handleCategoryAdded}
        onCategoryDeleted={handleCategoryDeleted}
      />

      {/* Change Password Modal */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Admin Login Modal */}
      <LoginModal />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StoreApp />
      </AuthProvider>
    </ToastProvider>
  );
}
