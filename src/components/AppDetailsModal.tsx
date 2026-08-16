import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  HardDrive, 
  Tag, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  Flame, 
  Clock, 
  Smartphone, 
  Layers,
  Edit3,
  Trash2,
  AlertCircle
} from 'lucide-react';
import type { AppItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';
import { ScreenshotLightbox } from './ScreenshotLightbox.tsx';

interface AppDetailsModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (app: AppItem) => void;
  onDelete?: (app: AppItem) => void;
  onToggleFeatured?: (app: AppItem) => void;
  onAppUpdated?: (updated: AppItem) => void;
}

export const AppDetailsModal: React.FC<AppDetailsModalProps> = ({
  app,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleFeatured,
  onAppUpdated,
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !app) return null;

  const handleDownload = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      const res = await api.recordDownload(app.id);
      
      const updatedApp = {
        ...app,
        downloadsCount: res.downloadsCount || app.downloadsCount + 1,
      };

      if (onAppUpdated) {
        onAppUpdated(updatedApp);
      }

      setDownloadSuccess(true);
      showToast({
        type: 'success',
        title: `Downloading ${app.name} APK`,
        description: `Version ${app.version} (${app.appSize}) — direct file download initiated.`,
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
      }, 4000);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        description: err.message || 'Could not download APK file.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRate = async (stars: number) => {
    try {
      setIsSubmittingRating(true);
      setUserRating(stars);
      const res = await api.rateApp(app.id, stars);
      
      const updatedApp = {
        ...app,
        rating: res.rating,
        ratingCount: res.ratingCount,
      };

      if (onAppUpdated) {
        onAppUpdated(updatedApp);
      }

      showToast({
        type: 'success',
        title: 'Thank you for your rating!',
        description: `You rated "${app.name}" ${stars} out of 5 stars.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rating Submission Failed',
        description: err.message || 'Could not submit rating.',
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleCopyLink = () => {
    try {
      const url = window.location.origin + window.location.pathname + `?app=${app.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast({
        type: 'info',
        title: 'Direct Link Copied',
        description: 'Shareable APK page URL copied to your clipboard.',
      });
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Fallback
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const defaultIcon = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80';
  const screenshots = app.screenshots && app.screenshots.length > 0 ? app.screenshots : [app.iconUrl || defaultIcon];

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
        <div 
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8 max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Controls */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Android APK
              </span>
              {app.isFeatured && (
                <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="share-app-btn"
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                title="Copy share link"
                aria-label="Share app"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              {isAdmin && (
                <>
                  <button
                    id="admin-edit-modal-btn"
                    onClick={() => onEdit && onEdit(app)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                    title="Edit App"
                    aria-label="Edit app"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    id="admin-delete-modal-btn"
                    onClick={() => onDelete && onDelete(app)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
                    title="Delete App"
                    aria-label="Delete app"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                id="close-app-details-btn"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-4 sm:p-6 sm:p-8 space-y-6">
            {/* Header Identity Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 bg-slate-950/50 p-5 sm:p-6 rounded-2xl border border-slate-800">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border-2 border-slate-700 shadow-xl">
                <img
                  src={app.iconUrl || defaultIcon}
                  alt={app.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-['Outfit',sans-serif]">
                    {app.name}
                  </h1>
                </div>
                
                <p className="text-sm font-semibold text-amber-400/90 flex items-center gap-1.5">
                  <span>{app.developer}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 font-normal">{app.category}</span>
                </p>

                {/* Rating & Stats Bar */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{app.rating ? app.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-400 text-[11px] font-normal">
                      ({app.ratingCount || 1} {app.ratingCount === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Download className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">{app.downloadsCount?.toLocaleString() || 0}</span>
                    <span>Downloads</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <HardDrive className="w-4 h-4 text-slate-400" />
                    <span>{app.appSize}</span>
                  </div>
                </div>
              </div>

              {/* Main Download APK CTA Button */}
              <div className="w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                <button
                  id="primary-download-apk-btn"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
                    downloadSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25'
                  }`}
                >
                  {downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Download Started!</span>
                    </>
                  ) : isDownloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Fetching APK...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download APK ({app.appSize})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Screenshots Gallery */}
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>📸 Screenshots & Previews</span>
                <span className="text-xs text-slate-500 normal-case font-normal">(Click any image to enlarge)</span>
              </h2>

              <div className="flex gap-3 overflow-x-auto pb-3 snap-x no-scrollbar">
                {screenshots.map((imgUrl, index) => (
                  <div
                    key={index}
                    onClick={() => openLightbox(index)}
                    className="relative w-44 sm:w-56 h-72 sm:h-80 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/80 hover:border-amber-500/60 transition-all cursor-pointer group shadow-md hover:shadow-xl hover:scale-[1.02] snap-start"
                  >
                    <img
                      src={imgUrl}
                      alt={`${app.name} preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                      <span className="text-xs font-semibold text-amber-300 bg-slate-900/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                        View Fullscreen
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What's New Changelog Box */}
            {app.whatsNew && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 sm:p-5">
                <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  What's New in Version {app.version}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {app.whatsNew}
                </p>
              </div>
            )}

            {/* Full App Description */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                About This Application
              </h2>
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
                <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {app.fullDescription || app.shortDescription}
                </p>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                Technical Specifications & Package Info
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Version</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 font-mono">v{app.version}</div>
                </div>

                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    <span>File Size</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">{app.appSize}</div>
                </div>

                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Min Android OS</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 truncate">
                    {app.minAndroidVersion || 'Android 8.0+'}
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Updated</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    {app.updatedAt || app.releaseDate || 'Recent'}
                  </div>
                </div>
              </div>

              {app.packageName && (
                <div className="mt-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Package Identifier:</span>
                  <span className="font-mono text-slate-300 font-semibold">{app.packageName}</span>
                </div>
              )}
            </div>

            {/* Interactive Rating Section */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Rate this APK</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Share your experience with the community
                </p>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    disabled={isSubmittingRating}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-lg hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        (hoverRating !== null ? star <= hoverRating : userRating !== null ? star <= userRating : false)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600 hover:text-amber-400/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Bottom Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400 truncate">
              Direct APK link: <span className="font-mono text-[11px] text-slate-500 truncate">{app.apkUrl}</span>
            </div>

            <button
              id="modal-footer-download-btn"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download APK</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Component */}
      <ScreenshotLightbox
        images={screenshots}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
        appName={app.name}
      />
    </>
  );
};
