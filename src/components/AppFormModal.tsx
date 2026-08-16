import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  Flame, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone,
  Tag,
  HardDrive,
  FileCode,
  Link,
  Image as ImageIcon
} from 'lucide-react';
import type { AppItem, CategoryItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appToEdit?: AppItem | null;
  categories: CategoryItem[];
  onSuccess: (savedApp: AppItem, isEdit: boolean) => void;
}

export const AppFormModal: React.FC<AppFormModalProps> = ({
  isOpen,
  onClose,
  appToEdit,
  categories,
  onSuccess,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const isEdit = !!appToEdit;

  // Form states
  const [name, setName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Utilities');
  const [version, setVersion] = useState('1.0.0');
  const [appSize, setAppSize] = useState('25.0 MB');
  const [apkUrl, setApkUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>(['']);
  const [whatsNew, setWhatsNew] = useState('');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(true);
  const [featuredTag, setFeaturedTag] = useState("Editor's Pick");
  const [packageName, setPackageName] = useState('');
  const [minAndroidVersion, setMinAndroidVersion] = useState('Android 8.0 (Oreo) or higher');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appToEdit) {
      setName(appToEdit.name || '');
      setDeveloper(appToEdit.developer || '');
      setIconUrl(appToEdit.iconUrl || '');
      setShortDescription(appToEdit.shortDescription || '');
      setFullDescription(appToEdit.fullDescription || '');
      setCategory(appToEdit.category || categories[0]?.name || 'Utilities');
      setVersion(appToEdit.version || '1.0.0');
      setAppSize(appToEdit.appSize || '25.0 MB');
      setApkUrl(appToEdit.apkUrl || '');
      setScreenshots(appToEdit.screenshots?.length ? appToEdit.screenshots : ['']);
      setWhatsNew(appToEdit.whatsNew || '');
      setReleaseDate(appToEdit.releaseDate || new Date().toISOString().split('T')[0]);
      setIsFeatured(!!appToEdit.isFeatured);
      setIsTrending(appToEdit.isTrending !== undefined ? !!appToEdit.isTrending : true);
      setFeaturedTag(appToEdit.featuredTag || "Editor's Pick");
      setPackageName(appToEdit.packageName || '');
      setMinAndroidVersion(appToEdit.minAndroidVersion || 'Android 8.0 (Oreo) or higher');
    } else {
      // Reset form
      setName('');
      setDeveloper('');
      setIconUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80');
      setShortDescription('');
      setFullDescription('');
      setCategory(categories[0]?.name || 'Utilities');
      setVersion('1.0.0');
      setAppSize('28.5 MB');
      setApkUrl('');
      setScreenshots([
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80'
      ]);
      setWhatsNew('Initial public release v1.0.0.\n• High-performance native Android experience.\n• Clean responsive design.');
      setReleaseDate(new Date().toISOString().split('T')[0]);
      setIsFeatured(false);
      setIsTrending(true);
      setFeaturedTag("Editor's Pick");
      setPackageName('');
      setMinAndroidVersion('Android 8.0 (Oreo) or higher');
    }
    setErrors({});
  }, [appToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleAddScreenshot = () => {
    setScreenshots([...screenshots, '']);
  };

  const handleScreenshotChange = (index: number, val: string) => {
    const next = [...screenshots];
    next[index] = val;
    setScreenshots(next);
  };

  const handleRemoveScreenshot = (index: number) => {
    if (screenshots.length === 1) {
      setScreenshots(['']);
    } else {
      setScreenshots(screenshots.filter((_, i) => i !== index));
    }
  };

  // Helper template filler for rapid testing by the owner
  const handleLoadSampleData = () => {
    const samples = [
      {
        name: 'OmniVPN — Ultra Fast & Private',
        developer: '🚀 Mabs Network ⚡',
        iconUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=256&auto=format&fit=crop&q=80',
        shortDescription: 'High-speed encrypted VPN tunnel with 10Gbps servers across 60+ countries and zero activity logs.',
        fullDescription: 'OmniVPN provides military-grade AES-256 encryption, split-tunneling, built-in ad blocker, and ultra-low latency game accelerators. Protect your digital privacy seamlessly.',
        category: '🛠️ Utilities',
        version: '3.2.0',
        appSize: '22.4 MB',
        apkUrl: 'https://github.com/mabs-tech/releases/raw/main/omnivpn-v3.2.0.apk',
        screenshots: [
          'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
        ],
        whatsNew: '• Added WireGuard v2 protocol.\n• 40% lower ping on gaming servers.\n• New kill-switch auto reconnections.',
        packageName: 'com.mabs.omnivpn',
        isFeatured: true,
      },
      {
        name: 'Nexus Pulse — Smart Habit Tracker',
        developer: 'Pulse Studios',
        iconUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=256&auto=format&fit=crop&q=80',
        shortDescription: 'Build enduring daily routines with heatmaps, streak analytics, lock screen widgets, and reminders.',
        fullDescription: 'Nexus Pulse transforms daily discipline into visual art. Track your water, workouts, reading, and meditation goals with beautiful interactive charts and zero distractions.',
        category: '💼 Productivity',
        version: '1.4.2',
        appSize: '16.8 MB',
        apkUrl: 'https://github.com/mabs-tech/releases/raw/main/nexus-pulse-v1.4.2.apk',
        screenshots: [
          'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop&q=80'
        ],
        whatsNew: '• Added 12 new interactive home screen widgets.\n• Export habit heatmaps to social cards.',
        packageName: 'com.pulse.nexus',
        isFeatured: false,
      }
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    setName(pick.name);
    setDeveloper(pick.developer);
    setIconUrl(pick.iconUrl);
    setShortDescription(pick.shortDescription);
    setFullDescription(pick.fullDescription);
    setCategory(pick.category);
    setVersion(pick.version);
    setAppSize(pick.appSize);
    setApkUrl(pick.apkUrl);
    setScreenshots(pick.screenshots);
    setWhatsNew(pick.whatsNew);
    setPackageName(pick.packageName);
    setIsFeatured(pick.isFeatured);
    showToast({
      type: 'info',
      title: 'Template Filled',
      description: 'Loaded sample APK metadata. You can customize fields before saving.',
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'App Name is required';
    if (!developer.trim()) errs.developer = 'Developer name is required';
    if (!category.trim()) errs.category = 'Category is required';
    if (!version.trim()) errs.version = 'Version string is required';
    if (!appSize.trim()) errs.appSize = 'App Size is required (e.g. 24.5 MB)';
    if (!apkUrl.trim()) {
      errs.apkUrl = 'APK Download URL is required';
    } else if (!apkUrl.startsWith('http://') && !apkUrl.startsWith('https://')) {
      errs.apkUrl = 'APK URL must start with http:// or https://';
    }
    if (!shortDescription.trim()) errs.shortDescription = 'Short description is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast({
        type: 'warning',
        title: 'Validation Incomplete',
        description: 'Please correct the highlighted fields before saving.',
      });
      return;
    }

    if (!token) {
      showToast({
        type: 'error',
        title: 'Unauthorized',
        description: 'You must be logged in as admin to modify apps.',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const cleanedScreenshots = screenshots
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload: Partial<AppItem> = {
        name: name.trim(),
        developer: developer.trim(),
        iconUrl: iconUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80',
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim() || shortDescription.trim(),
        category: category.trim(),
        version: version.trim(),
        appSize: appSize.trim(),
        apkUrl: apkUrl.trim(),
        screenshots: cleanedScreenshots.length > 0 ? cleanedScreenshots : [iconUrl.trim()],
        whatsNew: whatsNew.trim(),
        releaseDate: releaseDate,
        isFeatured: isFeatured,
        isTrending: isTrending,
        featuredTag: isFeatured ? (featuredTag.trim() || "Editor's Pick") : undefined,
        packageName: packageName.trim() || `com.${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}`,
        minAndroidVersion: minAndroidVersion.trim(),
      };

      let savedApp: AppItem;
      if (isEdit && appToEdit) {
        savedApp = await api.updateApp(appToEdit.id, payload, token);
        showToast({
          type: 'success',
          title: 'App Updated',
          description: `"${savedApp.name}" has been updated successfully.`,
        });
      } else {
        savedApp = await api.createApp(payload, token);
        showToast({
          type: 'success',
          title: 'App Published',
          description: `"${savedApp.name}" is now live on 🚀 Mabs Store ⚡.`,
        });
      }

      onSuccess(savedApp, isEdit);
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: isEdit ? 'Update Failed' : 'Publish Failed',
        description: err.message || 'An error occurred while saving the app.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2 font-['Outfit',sans-serif]">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {isEdit ? `Edit Application: ${appToEdit?.name}` : 'Publish New Application to Mabs Store'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? 'Update APK metadata, version, changelog and links.' : 'Add any generic Android APK to the live public catalog.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEdit && (
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-amber-500/30 transition-colors"
                title="Fill form with example data for quick testing"
              >
                <span>⚡ Fill Template</span>
              </button>
            )}

            <button
              id="close-app-form-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 sm:p-8 space-y-6">
          {/* Basic Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              Core Application Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* App Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  App Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="app-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Imran Khan Archive / Cyber Drift 3D"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border ${
                    errors.name ? 'border-rose-500' : 'border-slate-700'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500`}
                />
                {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              {/* Developer */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Developer / Studio Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="app-developer-input"
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder="e.g. 🚀 Mabs Tech ⚡"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border ${
                    errors.developer ? 'border-rose-500' : 'border-slate-700'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500`}
                />
                {errors.developer && <p className="text-[11px] text-rose-400 mt-1">{errors.developer}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  id="app-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} className="bg-slate-900 text-slate-100">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Version */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Version <span className="text-rose-400">*</span>
                </label>
                <input
                  id="app-version-input"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.0.0"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border ${
                    errors.version ? 'border-rose-500' : 'border-slate-700'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500 font-mono`}
                />
                {errors.version && <p className="text-[11px] text-rose-400 mt-1">{errors.version}</p>}
              </div>

              {/* App Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  App Size <span className="text-rose-400">*</span>
                </label>
                <input
                  id="app-size-input"
                  type="text"
                  value={appSize}
                  onChange={(e) => setAppSize(e.target.value)}
                  placeholder="e.g. 38.2 MB"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border ${
                    errors.appSize ? 'border-rose-500' : 'border-slate-700'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500`}
                />
                {errors.appSize && <p className="text-[11px] text-rose-400 mt-1">{errors.appSize}</p>}
              </div>
            </div>
          </div>

          {/* APK Link & Icon */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" />
              APK Download & Media Assets
            </h3>

            {/* APK Download URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                APK Download URL <span className="text-rose-400">* (Direct downloadable APK link)</span>
              </label>
              <input
                id="app-apk-url-input"
                type="url"
                value={apkUrl}
                onChange={(e) => setApkUrl(e.target.value)}
                placeholder="https://github.com/org/repo/releases/download/v1.0/app.apk"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border ${
                  errors.apkUrl ? 'border-rose-500' : 'border-slate-700'
                } focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500 font-mono`}
              />
              {errors.apkUrl && <p className="text-[11px] text-rose-400 mt-1">{errors.apkUrl}</p>}
            </div>

            {/* Icon URL with preview */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  App Icon URL
                </label>
                <input
                  id="app-icon-url-input"
                  type="url"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://example.com/icon.png"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                  <img
                    src={iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  <span>Icon Preview</span>
                </div>
              </div>
            </div>

            {/* Screenshots URLs Array */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Screenshots / Gallery URLs
                </label>
                <button
                  type="button"
                  onClick={handleAddScreenshot}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Screenshot</span>
                </button>
              </div>

              {screenshots.map((sUrl, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={sUrl}
                    onChange={(e) => handleScreenshotChange(idx, e.target.value)}
                    placeholder={`Screenshot URL #${idx + 1}`}
                    className="flex-1 px-3.5 py-2 rounded-xl text-sm bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveScreenshot(idx)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Descriptions & Changelog */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              Descriptions & Release Notes
            </h3>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Short Summary (Card Preview) <span className="text-rose-400">*</span>
              </label>
              <input
                id="app-short-desc-input"
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A concise 1-2 sentence overview shown on store cards..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border ${
                  errors.shortDescription ? 'border-rose-500' : 'border-slate-700'
                } focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500`}
              />
              {errors.shortDescription && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.shortDescription}</p>
              )}
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Detailed Description
              </label>
              <textarea
                id="app-full-desc-textarea"
                rows={5}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Comprehensive description, features list, background story..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500"
              />
            </div>

            {/* What's New */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                What's New (Changelog)
              </label>
              <textarea
                id="app-whats-new-textarea"
                rows={3}
                value={whatsNew}
                onChange={(e) => setWhatsNew(e.target.value)}
                placeholder="• Bug fixes and speed enhancements&#10;• New feature additions..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Status, Package & Metadata */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Promotion & System Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Featured toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Featured Spotlight</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Show in Featured Hero carousel</div>
                </div>
                <input
                  id="app-is-featured-checkbox"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Trending toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Trending Badge</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Highlight as trending on homepage</div>
                </div>
                <input
                  id="app-is-trending-checkbox"
                  type="checkbox"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Package Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Package Name (Optional)
                </label>
                <input
                  id="app-package-name-input"
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="com.example.myapp"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500 font-mono text-xs"
                />
              </div>

              {/* Min Android OS */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Minimum Android Requirement
                </label>
                <input
                  id="app-min-android-input"
                  type="text"
                  value={minAndroidVersion}
                  onChange={(e) => setMinAndroidVersion(e.target.value)}
                  placeholder="Android 8.0 (Oreo) or higher"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>

            <button
              id="submit-app-form-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Save App Changes' : 'Publish App to Store'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
