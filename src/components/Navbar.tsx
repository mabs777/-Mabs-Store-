import React from 'react';
import { 
  Rocket, 
  Search, 
  Shield, 
  ShieldCheck, 
  Sun, 
  Moon, 
  PlusCircle, 
  LayoutDashboard, 
  LogOut,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { StoreStats } from '../types.ts';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenAddApp: () => void;
  onOpenAdminDashboard: () => void;
  currentView: 'store' | 'admin';
  onNavigate: (view: 'store' | 'admin') => void;
  stats?: StoreStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  onOpenAddApp,
  onOpenAdminDashboard,
  currentView,
  onNavigate,
  stats,
}) => {
  const { isAdmin, username, openLoginModal, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-200 bg-slate-950/85 border-slate-800/80 text-slate-100">
      {/* Top Banner / Announcement if Store is Live */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs font-medium text-amber-300 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Official <strong>🚀 Mabs Store ⚡</strong> APK Marketplace — Fast, Verified & Direct Downloads</span>
        {stats && stats.totalApps > 0 && (
          <span className="hidden sm:inline-block bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30">
            {stats.totalApps} {stats.totalApps === 1 ? 'App' : 'Apps'} Available
          </span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-6">
          {/* Logo & Brand */}
          <button 
            id="nav-logo-btn"
            onClick={() => {
              onNavigate('store');
              onSelectCategory('all');
            }}
            className="flex items-center gap-2.5 sm:gap-3 group text-left focus:outline-none shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 p-0.5 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent font-['Outfit',sans-serif]">
                  Mabs Store
                </span>
                <span className="text-amber-400 text-xs sm:text-sm font-black">⚡</span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 tracking-wider font-semibold uppercase">
                APK Marketplace
              </span>
            </div>
          </button>

          {/* Search bar in header (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search APKs, developers, categories..."
                className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-slate-900/90 border border-slate-700/70 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* View Switcher: Store vs Admin Dashboard */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-amber-500/30">
                <button
                  id="view-store-btn"
                  onClick={() => onNavigate('store')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentView === 'store'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Store</span>
                </button>

                <button
                  id="view-admin-dashboard-btn"
                  onClick={() => onNavigate('admin')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentView === 'admin'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </button>
              </div>
            ) : null}

            {/* Quick Add App button (Admin Only) */}
            {isAdmin && (
              <button
                id="header-add-app-btn"
                onClick={onOpenAddApp}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add App</span>
              </button>
            )}

            {/* Admin Login / Logout */}
            {isAdmin ? (
              <div className="flex items-center gap-1">
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin: {username || 'Owner'}</span>
                </div>
                <button
                  id="logout-btn"
                  onClick={logout}
                  title="Log out of Admin Mode"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="login-btn"
                onClick={openLoginModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-semibold transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
              aria-label="Toggle theme"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (under header on small screens) */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="mobile-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search APKs, categories, developers..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-slate-900/90 border border-slate-700/70 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
