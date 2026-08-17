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
  const { isAdmin, token } = useAuth();
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

  // Track admin login/logout transitions
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

  // Load initial data safely
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [appsData, catsData, statsData] = await Promise.all([
        api.getApps().catch(() => []),
        api.getCategories().catch(() => []),
        api.getStats().catch(() => null),
      ]);

      setApps(Array.isArray(appsData) ? appsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      if (statsData) setStats(statsData);

      // Deep link URL check (?app=id)
      const urlParams = new URLSearchParams(window.location.search);
      const deepAppId = urlParams.get('app');
      if (deepAppId && Array.isArray(appsData)) {
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

  // Update URL on app selection
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

  // Robust Category & Search Filter Logic
  const filteredApps = useMemo(() => {
    let result = [...apps];

    // 1. Filter by category
    if (activeCategory && activeCategory !== 'all') {
      const clean = (str: string) =>
        (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

      const targetCat = clean(activeCategory);

      // Find matching category object if activeCategory is ID or Name
      const matchedCatObj = categories.find(
        (c) => clean(c.id) === targetCat || clean(c.name) === targetCat
      );

      const validTargetNames = [
        targetCat,
        matchedCatObj ? clean(matchedCatObj.name) : '',
        matchedCatObj ? clean(matchedCatObj.id) : '',
      ].filter(Boolean);

      result = result.filter((app) => {
        const appCatClean = clean(app.category);
        return validTargetNames.some(
          (t) => appCatClean === t || appCatClean.includes(t) || t.includes(appCatClean)
        );
      });
    }

    // 2. Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/);
      result = result.filter((app) => {
        const fullText = `${app.name || ''} ${app.developer || ''} ${app.category || ''} ${app.shortDescription || ''} ${app.fullDescription || ''} ${app.packageName || ''}`.toLowerCase();
        return terms.every((t) => fullText.includes(t));
      });
    }

    // 3. Sorting
    if (activeSort === 'trending') {
      result.sort(
        (a, b) =>
          (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) ||
          (b.downloadsCount || 0) - (a.downloadsCount || 0)
      );
    } else if (activeSort === 'latest') {
      result.sort(
        (a, b) =>
          new Date(b.releaseDate || b.updatedAt || 0).getTime() -
          new Date(a.releaseDate || a.updatedAt || 0).getTime()
      );
    } else if (activeSort === 'popular') {
      result.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
    } else if (activeSort === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeSort === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [apps, categories, activeCategory, searchQuery, activeSort]);

  // Featured apps
  const featuredApps = useMemo(() => apps.filter((a) => a.isFeatured), [apps]);

  // App handlers
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
        description: `"${updated.name}" status updated.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        description: err.message || 'Could not toggle status.',
      });
    }
  };

  const handleAppSaved = (savedApp: AppItem, isEdit: boolean) => {
    if (isEdit) {
      setApps((prev) => prev.map((a) => (a.id === savedApp.id ? savedApp : a)));
      if (selectedApp?.id === savedApp.id) setSelectedApp(savedApp);
    } else {
      setApps((prev) => [savedApp, ...prev]);
    }
  };

  const handleAppDeleted = (appId: string) => {
    setApps((prev) => prev.filter((a) => a.id !== appId));
    if (selectedApp?.id === appId) setSelectedApp(null);
  };

  const handleDownloadCompleted = (appId: string, newDownloadsCount: number) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, downloadsCount: newDownloadsCount } : a))
    );
    if (selectedApp?.id === appId) {
      setSelectedApp((prev) => (prev ? { ...prev, downloadsCount: newDownloadsCount } : null));
    }
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

      <main className="flex-1">
        {currentView === 'admin' && isAdmin ? (
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
            {isLoading && (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-slate-300">Loading Mabs Store APKs...</p>
              </div>
            )}

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
                {!isFiltering && featuredApps.length > 0 && (
                  <FeaturedCarousel
                    apps={featuredApps}
                    onSelectApp={setSelectedApp}
                    onDownloadCompleted={handleDownloadCompleted}
                  />
                )}

                {/* Category Pills */}
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
                      onClick={() => setActiveCategory('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        activeCategory === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>⚡ All Applications</span>
                    </button>

                    {categories.map((cat) => {
                      const clean = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      const isSelected =
                        clean(activeCategory) === clean(cat.name) ||
                        clean(activeCategory) === clean(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.name)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter / Sort Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="font-bold text-slate-100 text-sm">
                      {isFiltering ? 'Filter Results' : 'All Android APKs'}
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

                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={activeSort}
                      onChange={(e) => setActiveSort(e.target.value as SortOption)}
                      className="bg-slate-900 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
                    >
                      <option value="trending">🔥 Trending First</option>
                      <option value="latest">🆕 Latest Releases</option>
                      <option value="popular">⬇️ Most Downloaded</option>
                      <option value="rating">⭐ Highest Rated</option>
                      <option value="name">🔤 Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Grid */}
                {apps.length === 0 ? (
                  <EmptyState type="catalog-empty" onOpenAddApp={handleOpenAddApp} />
                ) : filteredApps.length === 0 ? (
                  <EmptyState
                    type="search-empty"
                    searchQuery={searchQuery || activeCategory}
                    onResetSearch={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                  />
                ) : (
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
            <Rocket className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-slate-200 text-sm">🚀 Mabs Store ⚡</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} Mabs Store. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
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

      <AppFormModal
        isOpen={isAppFormOpen}
        onClose={() => setIsAppFormOpen(false)}
        appToEdit={appToEdit}
        categories={categories}
        onSuccess={handleAppSaved}
      />

      <DeleteConfirmModal
        app={appToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={handleAppDeleted}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onCategoryAdded={(newCat) => setCategories((prev) => [...prev, newCat])}
        onCategoryDeleted={(catId) => setCategories((prev) => prev.filter((c) => c.id !== catId))}
      />

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

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
        
