import React, { useState, useEffect, useRef } from 'react';
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
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  Loader2,
  FileUp,
  ExternalLink
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

  // File Upload State Trackers
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [iconUploadProgress, setIconUploadProgress] = useState(0);
  const [isUploadingApk, setIsUploadingApk] = useState(false);
  const [apkUploadProgress, setApkUploadProgress] = useState(0);
  const [isUploadingScreenshots, setIsUploadingScreenshots] = useState(false);
  const [screenshotUploadProgress, setScreenshotUploadProgress] = useState<Record<number, number>>({});

  // Hidden File Inputs
  const iconInputRef = useRef<HTMLInputElement>(null);
  const apkInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);

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
      setIconUrl('');
      setShortDescription('');
      setFullDescription('');
      setCategory(categories[0]?.name || 'Utilities');
      setVersion('1.0.0');
      setAppSize('');
      setApkUrl('');
      setScreenshots(['']);
      setWhatsNew('');
      setReleaseDate(new Date().toISOString().split('T')[0]);
      setIsFeatured(false);
      setIsTrending(false);
      setFeaturedTag('');
      setPackageName('');
      setMinAndroidVersion('Android 8.0 or higher');
    }
    setErrors({});
    setIsUploadingIcon(false);
    setIsUploadingApk(false);
    setIsUploadingScreenshots(false);
  }, [appToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Helper format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  // 1. Direct Vercel Blob Upload for Icon
  const handleIconFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Invalid Icon File',
        description: 'Please select a valid image file (PNG, JPG, WEBP, SVG).',
      });
      return;
    }

    if (!token) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        description: 'Admin session token required to upload assets.',
      });
      return;
    }

    try {
      setIsUploadingIcon(true);
      setIconUploadProgress(0);

      const result = await api.uploadFile(file, token, (percent) => {
        setIconUploadProgress(percent);
      });

      setIconUrl(result.url);
      setErrors((prev) => ({ ...prev, iconUrl: '' }));
      showToast({
        type: 'success',
        title: 'Icon Uploaded',
        description: `Persistent Blob URL generated: ${file.name}`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Icon Upload Failed',
        description: err.message || 'Failed to upload icon to Vercel Blob storage.',
      });
    } finally {
      setIsUploadingIcon(false);
      if (iconInputRef.current) iconInputRef.current.value = '';
    }
  };

  // 2. Direct Vercel Blob Upload for APK File
  const handleApkFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.apk')) {
      showToast({
        type: 'error',
        title: 'Invalid APK File',
        description: 'Selected file must have a .apk extension.',
      });
      return;
    }

    if (!token) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        description: 'Admin session token required to upload assets.',
      });
      return;
    }

    try {
      setIsUploadingApk(true);
      setApkUploadProgress(0);

      // Auto-set app size if empty
      if (!appSize.trim()) {
        setAppSize(formatBytes(file.size));
      }

      // Auto-set app name if empty
      if (!name.trim()) {
        const cleanName = file.name.replace(/\.apk$/i, '').replace(/[-_]/g, ' ');
        setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }

      const result = await api.uploadFile(file, token, (percent) => {
        setApkUploadProgress(percent);
      });

      setApkUrl(result.url);
      setErrors((prev) => ({ ...prev, apkUrl: '' }));
      showToast({
        type: 'success',
        title: 'APK Uploaded Successfully',
        description: `Direct download Blob URL generated (${formatBytes(file.size)}).`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'APK Upload Failed',
        description: err.message || 'Failed to upload APK to Vercel Blob storage.',
      });
    } finally {
      setIsUploadingApk(false);
      if (apkInputRef.current) apkInputRef.current.value = '';
    }
  };

  // 3. Direct Vercel Blob Upload for Screenshots
  const handleScreenshotsSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      showToast({
        type: 'error',
        title: 'Invalid Files',
        description: 'Please select valid image files for screenshots.',
      });
      return;
    }

    if (!token) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        description: 'Admin session token required to upload assets.',
      });
      return;
    }

    try {
      setIsUploadingScreenshots(true);
      const newUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const result = await api.uploadFile(file, token, (percent) => {
          setScreenshotUploadProgress((prev) => ({ ...prev, [i]: percent }));
        });
        newUrls.push(result.url);
      }

      // Merge with existing non-empty screenshots
      const existingClean = screenshots.filter((s) => s.trim().length > 0);
      setScreenshots([...existingClean, ...newUrls]);

      showToast({
        type: 'success',
        title: `${imageFiles.length} Screenshot(s) Uploaded`,
        description: 'Persistent Blob URLs generated and attached.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Screenshots Upload Failed',
        description: err.message || 'Failed to upload screenshots to Vercel Blob.',
      });
    } finally {
      setIsUploadingScreenshots(false);
      setScreenshotUploadProgress({});
      if (screenshotsInputRef.current) screenshotsInputRef.current.value = '';
    }
  };

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

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'App Name is required';
    if (!developer.trim()) errs.developer = 'Developer name is required';
    if (!category.trim()) errs.category = 'Category is required';
    if (!version.trim()) errs.version = 'Version string is required';
    if (!appSize.trim()) errs.appSize = 'App Size is required (e.g. 24.5 MB)';
    if (!apkUrl.trim()) {
      errs.apkUrl = 'APK File or direct download URL is required';
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
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

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
        screenshots: cleanedScreenshots.length > 0 ? cleanedScreenshots : [iconUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'],
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
              {isEdit ? 'Update APK metadata, version, changelog and assets.' : 'Upload APK, Icon & Screenshots directly with direct Vercel Blob storage.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
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
          
          {/* SECTION 1: DIRECT FILE UPLOADS (Icon, Screenshots, APK) */}
          <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-slate-950/40 to-slate-900/60 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-amber-400" />
                Vercel Blob Direct File Uploads
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Direct Client Upload
              </span>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={iconInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleIconFileSelect}
            />
            <input
              type="file"
              ref={apkInputRef}
              accept=".apk,application/vnd.android.package-archive"
              className="hidden"
              onChange={handleApkFileSelect}
            />
            <input
              type="file"
              ref={screenshotsInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleScreenshotsSelect}
            />

            {/* Upload Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* 1. App Icon Upload Card */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                    {iconUrl ? (
                      <img src={iconUrl} alt="App Icon" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-200 block truncate">1. App Icon</span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {iconUrl ? 'Uploaded & Ready' : 'From Phone / Files'}
                    </span>
                  </div>
                </div>

                {isUploadingIcon ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-amber-400 font-semibold">
                      <span>Uploading Icon...</span>
                      <span>{iconUploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-200"
                        style={{ width: `${iconUploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 hover:border-amber-500 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{iconUrl ? 'Replace Icon' : 'Select Icon File'}</span>
                  </button>
                )}
              </div>

              {/* 2. APK File Upload Card */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0 flex items-center justify-center text-amber-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-200 block truncate">2. Android APK</span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {apkUrl ? 'Direct APK Linked' : 'Original APK File'}
                    </span>
                  </div>
                </div>

                {isUploadingApk ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-amber-400 font-semibold">
                      <span>Uploading APK to Blob...</span>
                      <span>{apkUploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-200"
                        style={{ width: `${apkUploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => apkInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{apkUrl ? 'Replace APK File' : 'Select APK File'}</span>
                  </button>
                )}
              </div>

              {/* 3. Screenshots Multi-Upload Card */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-200 block truncate">3. Screenshots</span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {screenshots.filter((s) => s.trim().length > 0).length} Attached
                    </span>
                  </div>
                </div>

                {isUploadingScreenshots ? (
                  <div className="flex items-center justify-center py-2 text-xs font-bold text-amber-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading Gallery...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => screenshotsInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Screenshots</span>
                  </button>
                )}
              </div>

            </div>

            {/* Generated URLs Feedback & Status */}
            {(apkUrl || iconUrl) && (
              <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                {apkUrl && (
                  <div className="flex items-center gap-1.5 text-emerald-400 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">APK Blob URL: <span className="font-mono text-[10px] text-slate-300">{apkUrl}</span></span>
                  </div>
                )}
                {iconUrl && (
                  <div className="flex items-center gap-1.5 text-emerald-400 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Icon Blob URL: <span className="font-mono text-[10px] text-slate-300">{iconUrl}</span></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: CORE APPLICATION INFORMATION */}
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

          {/* SECTION 3: APK & ASSET URL INPUTS (Automatic from upload or manual) */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              APK Download URL & Asset Links
            </h3>

            {/* APK Download URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                APK Download URL <span className="text-rose-400">* (Generated automatically by upload or entered manually)</span>
              </label>
              <input
                id="app-apk-url-input"
                type="url"
                value={apkUrl}
                onChange={(e) => setApkUrl(e.target.value)}
                placeholder="https://...public.blob.vercel-storage.com/app.apk"
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
                  placeholder="https://...public.blob.vercel-storage.com/icon.png"
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

            {/* Screenshots Gallery URLs Array */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Screenshots / Gallery URLs ({screenshots.filter((s) => s.trim().length > 0).length})
                </label>
                <button
                  type="button"
                  onClick={handleAddScreenshot}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL Field</span>
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
                  {sUrl && (
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                      <img src={sUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveScreenshot(idx)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: DESCRIPTIONS & CHANGELOG */}
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
                placeholder="• Bug fixes and performance enhancements&#10;• Initial release..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* SECTION 5: PROMOTION & SYSTEM METADATA */}
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
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="submit-app-form-btn"
              type="submit"
              disabled={isSubmitting || isUploadingIcon || isUploadingApk || isUploadingScreenshots}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
