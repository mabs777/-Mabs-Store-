import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import type { AppItem } from '../types.ts';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';

interface FeaturedCarouselProps {
  apps: AppItem[];
  onSelectApp: (app: AppItem) => void;
  onDownloadCompleted?: (appId: string, count: number) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  apps,
  onSelectApp,
  onDownloadCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (apps.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % apps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [apps.length]);

  if (apps.length === 0) return null;

  const currentApp = apps[currentIndex] || apps[0];
  const defaultIcon = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80';
  const heroImage = currentApp.screenshots?.[0] || currentApp.iconUrl || defaultIcon;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      const res = await api.recordDownload(currentApp.id);
      if (onDownloadCompleted && res.downloadsCount) {
        onDownloadCompleted(currentApp.id, res.downloadsCount);
      }
      showToast({
        type: 'success',
        title: `Downloading ${currentApp.name}`,
        description: `Version ${currentApp.version} (${currentApp.appSize}) is downloading.`,
      });

      const link = document.createElement('a');
      link.href = res.apkUrl || currentApp.apkUrl;
      link.download = `${currentApp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-v${currentApp.version}.apk`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        description: err.message || 'Could not download APK.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl mb-8 group">
      {/* Background Graphic Blur Layer */}
      <div className="absolute inset-0 z-0 opacity-25 overflow-hidden">
        <img
          src={heroImage}
          alt=""
          className="w-full h-full object-cover filter blur-3xl scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />
      </div>

      {/* Main Content Area */}
      <div 
        onClick={() => onSelectApp(currentApp)}
        className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 cursor-pointer"
      >
        <div className="flex-1 max-w-2xl">
          {/* Spotlight Tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {currentApp.featuredTag || "Editor's Choice"}
            </span>
            <span className="text-xs text-amber-400 font-semibold bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700">
              {currentApp.category}
            </span>
          </div>

          {/* Title & Developer */}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border-2 border-amber-500/40 shadow-xl">
              <img
                src={currentApp.iconUrl || defaultIcon}
                alt={currentApp.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-['Outfit',sans-serif] group-hover:text-amber-400 transition-colors">
                {currentApp.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                <span>{currentApp.developer}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed mb-4">
            {currentApp.shortDescription || currentApp.fullDescription}
          </p>

          {/* Metadata chips & CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{currentApp.rating ? currentApp.rating.toFixed(1) : '5.0'}</span>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
              v{currentApp.version}
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>{currentApp.appSize}</span>
            </div>

            <button
              id={`featured-download-btn-${currentApp.id}`}
              onClick={handleDownload}
              disabled={isDownloading}
              className="ml-auto sm:ml-0 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Get APK Now</span>
            </button>
          </div>
        </div>

        {/* Screenshot showcase in carousel */}
        {currentApp.screenshots && currentApp.screenshots.length > 0 && (
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {currentApp.screenshots.slice(0, 2).map((img, i) => (
              <div
                key={i}
                className="w-36 h-56 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/80 shadow-2xl hover:scale-105 transition-transform"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {apps.length > 1 && (
        <div className="relative z-10 px-6 pb-4 pt-0 flex items-center justify-between border-t border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center gap-1.5">
            {apps.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((currentIndex - 1 + apps.length) % apps.length);
              }}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              aria-label="Previous featured app"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((currentIndex + 1) % apps.length);
              }}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              aria-label="Next featured app"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
