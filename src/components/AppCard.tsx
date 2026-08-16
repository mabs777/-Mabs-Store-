import React, { useState } from 'react';
import { 
  Download, 
  Star, 
  Sparkles, 
  HardDrive, 
  Tag, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  ExternalLink,
  Flame,
  CheckCircle2
} from 'lucide-react';
import type { AppItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';

interface AppCardProps {
  app: AppItem;
  onSelect: (app: AppItem) => void;
  onEdit?: (app: AppItem) => void;
  onDelete?: (app: AppItem) => void;
  onToggleFeatured?: (app: AppItem) => void;
  onDownloadCompleted?: (appId: string, newDownloadsCount: number) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onSelect,
  onEdit,
  onDelete,
  onToggleFeatured,
  onDownloadCompleted,
}) => {
  const { isAdmin, token } = useAuth();
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      const res = await api.recordDownload(app.id);
      
      if (onDownloadCompleted && res.downloadsCount) {
        onDownloadCompleted(app.id, res.downloadsCount);
      }

      setDownloadSuccess(true);
      showToast({
        type: 'success',
        title: `Starting Download: ${app.name}`,
        description: `Version ${app.version} (${app.appSize}) — APK is downloading directly.`,
      });

      // Direct APK download triggering using the stored APK URL
      const link = document.createElement('a');
      link.href = res.apkUrl || app.apkUrl;
      link.download = `${app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-v${app.version}.apk`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3000);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        description: err.message || 'Could not initiate APK download.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const defaultIcon = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80';

  return (
    <div
      id={`app-card-${app.id}`}
      onClick={() => onSelect(app)}
      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between cursor-pointer shadow-md hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5"
    >
      {/* Badges row: Featured / Trending / Admin quick actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {app.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {app.featuredTag || 'Featured'}
            </span>
          )}
          {app.isTrending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
              <Flame className="w-3 h-3 text-orange-400" />
              Trending
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            <Tag className="w-3 h-3 text-slate-400" />
            {app.category}
          </span>
        </div>

        {/* Rating & Size */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-0.5 text-amber-400 font-bold bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-700/50">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{app.rating ? app.rating.toFixed(1) : '5.0'}</span>
          </div>
        </div>
      </div>

      {/* Main App Info */}
      <div className="flex items-start gap-3.5 mb-3.5">
        {/* App Icon */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 group-hover:border-amber-500/50 transition-colors shadow-inner">
          <img
            src={imageError ? defaultIcon : (app.iconUrl || defaultIcon)}
            alt={app.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center text-slate-500 text-xs">
              APK
            </div>
          )}
        </div>

        {/* Title, Developer & Stats */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-amber-400 transition-colors truncate font-['Outfit',sans-serif]">
            {app.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
            <span className="truncate">{app.developer}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Verified Safe APK" />
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
            <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 font-mono">
              v{app.version}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-500" />
              {app.appSize}
            </span>
          </div>
        </div>
      </div>

      {/* Short Description */}
      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
        {app.shortDescription || app.fullDescription?.substring(0, 100) || 'Verified Android Application package ready for instant installation.'}
      </p>

      {/* Action Footer: Downloads count & Download Button */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
        <div className="text-[11px] text-slate-400">
          <span className="font-semibold text-slate-200">
            {app.downloadsCount?.toLocaleString() || 0}
          </span> downloads
        </div>

        <div className="flex items-center gap-2">
          {/* Admin quick controls */}
          {isAdmin && (
            <div className="flex items-center gap-1 mr-1" onClick={(e) => e.stopPropagation()}>
              <button
                id={`edit-app-${app.id}`}
                onClick={() => onEdit && onEdit(app)}
                title="Edit App Details"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                aria-label="Edit app"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                id={`delete-app-${app.id}`}
                onClick={() => onDelete && onDelete(app)}
                title="Delete App"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                aria-label="Delete app"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Download APK Button */}
          <button
            id={`download-apk-${app.id}`}
            onClick={handleDownload}
            disabled={isDownloading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/10'
            }`}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Downloaded</span>
              </>
            ) : isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
