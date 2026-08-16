import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Sparkles, 
  HardDrive, 
  Download, 
  Star, 
  Edit3, 
  Trash2, 
  Tag, 
  Layers, 
  ShieldCheck, 
  Key, 
  Search, 
  FolderPlus, 
  ExternalLink,
  Flame,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ArrowLeft
} from 'lucide-react';
import type { AppItem, CategoryItem, StoreStats } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';

interface AdminDashboardProps {
  apps: AppItem[];
  categories: CategoryItem[];
  stats: StoreStats | null;
  onOpenAddApp: () => void;
  onEditApp: (app: AppItem) => void;
  onDeleteApp: (app: AppItem) => void;
  onOpenCategoryManager: () => void;
  onOpenPasswordModal: () => void;
  onRefreshData: () => void;
  onNavigateToStore: () => void;
  onToggleFeatured: (app: AppItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  apps,
  categories,
  stats,
  onOpenAddApp,
  onEditApp,
  onDeleteApp,
  onOpenCategoryManager,
  onOpenPasswordModal,
  onRefreshData,
  onNavigateToStore,
  onToggleFeatured,
}) => {
  const { username, token } = useAuth();
  const { showToast } = useToast();
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      !filterSearch ||
      app.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      app.developer.toLowerCase().includes(filterSearch.toLowerCase()) ||
      app.category.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' ||
      app.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const totalDownloads = stats?.totalDownloads ?? apps.reduce((acc, a) => acc + (a.downloadsCount || 0), 0);
  const featuredAppsCount = stats?.featuredCount ?? apps.filter((a) => a.isFeatured).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <button
            onClick={onNavigateToStore}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Storefront</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 font-['Outfit',sans-serif] flex items-center gap-2.5">
            <LayoutDashboard className="w-7 h-7 text-amber-400" />
            <span>Admin Management Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as <strong className="text-amber-300">{username || 'admin'}</strong> — Store Owner Privileges Active
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="admin-new-app-btn"
            onClick={onOpenAddApp}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New App</span>
          </button>

          <button
            id="admin-category-mgr-btn"
            onClick={onOpenCategoryManager}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            id="admin-change-pwd-btn"
            onClick={onOpenPasswordModal}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Change Password</span>
          </button>

          <button
            onClick={onRefreshData}
            title="Refresh database"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700 transition-colors"
            aria-label="Refresh catalogue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Apps */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Catalog Apps</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-['Outfit',sans-serif]">
            {apps.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for public downloads</div>
        </div>

        {/* Total Downloads */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total APK Downloads</span>
            <Download className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-['Outfit',sans-serif]">
            {totalDownloads.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Direct APK transfers recorded</div>
        </div>

        {/* Featured Apps */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Featured Spotlights</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-['Outfit',sans-serif]">
            {featuredAppsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Highlighted in Hero carousel</div>
        </div>

        {/* Categories */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Categories</span>
            <Tag className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-['Outfit',sans-serif]">
            {categories.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Organized taxonomy</div>
        </div>
      </div>

      {/* App Inventory Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Inventory Header Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit',sans-serif]">
              Published Applications ({filteredApps.length})
            </h2>
            <p className="text-xs text-slate-400">Manage, edit, feature or delete apps stored in database</p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Filter apps in table..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Category Select */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Table / Cards */}
        {filteredApps.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No Applications in Catalogue</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {filterSearch ? 'No apps match your search filter.' : 'You have not added any apps to Mabs Store yet.'}
            </p>
            <button
              onClick={onOpenAddApp}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 inline-flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Your First APK</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Category</th>
                  <th className="py-3 px-4">Version & Size</th>
                  <th className="py-3 px-4 hidden md:table-cell">Downloads</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* App icon & name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-100 truncate text-sm">{app.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{app.developer}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 text-[11px]">
                        {app.category}
                      </span>
                    </td>

                    {/* Version & Size */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-200">v{app.version}</div>
                      <div className="text-[11px] text-slate-400">{app.appSize}</div>
                    </td>

                    {/* Downloads */}
                    <td className="py-3 px-4 hidden md:table-cell font-mono text-emerald-400">
                      {app.downloadsCount?.toLocaleString() || 0}
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleFeatured(app)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                          app.isFeatured
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${app.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
                        <span>{app.isFeatured ? 'Featured' : 'Not Featured'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditApp(app)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                          title="Edit App Details"
                          aria-label="Edit app"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteApp(app)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition-colors"
                          title="Delete App"
                          aria-label="Delete app"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
