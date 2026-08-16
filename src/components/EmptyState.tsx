import React from 'react';
import { Rocket, Search, PlusCircle, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface EmptyStateProps {
  type: 'catalog-empty' | 'search-empty';
  searchQuery?: string;
  onResetSearch?: () => void;
  onOpenAddApp?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchQuery,
  onResetSearch,
  onOpenAddApp,
}) => {
  const { isAdmin, openLoginModal } = useAuth();

  if (type === 'search-empty') {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-xl">
          <Search className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 font-['Outfit',sans-serif]">
          No Applications Found
        </h3>
        <p className="text-sm text-slate-400 mt-1.5 mb-6 leading-relaxed">
          We couldn't find any APKs matching <span className="text-amber-300 font-semibold font-mono">"{searchQuery}"</span>. Try searching with different keywords or reset your filters.
        </p>
        {onResetSearch && (
          <button
            id="reset-search-btn"
            onClick={onResetSearch}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Search & Filters</span>
          </button>
        )}
      </div>
    );
  }

  // Fresh / Clean store with 0 apps
  return (
    <div className="py-16 sm:py-24 px-4 text-center max-w-lg mx-auto bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-xl my-6">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400 shadow-2xl">
        <Rocket className="w-10 h-10 animate-bounce" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
        <span>🚀 Mabs Store ⚡</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-['Outfit',sans-serif]">
        No apps available yet.
      </h2>

      <p className="text-sm text-slate-300 mt-2 mb-8 leading-relaxed">
        The application catalog is currently empty. As the administrator, you can publish Android APKs with screenshots, changelogs, and direct download links.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {isAdmin ? (
          <button
            id="empty-state-add-app-btn"
            onClick={onOpenAddApp}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Publish Your First APK</span>
          </button>
        ) : (
          <button
            id="empty-state-admin-login-btn"
            onClick={openLoginModal}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Shield className="w-5 h-5" />
            <span>Admin Login to Add Apps</span>
          </button>
        )}
      </div>
    </div>
  );
};
