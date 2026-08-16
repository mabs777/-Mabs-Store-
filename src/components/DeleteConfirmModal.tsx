import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { AppItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';

interface DeleteConfirmModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (appId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  app,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !app) return null;

  const handleDelete = async () => {
    if (!token) return;
    try {
      setIsDeleting(true);
      await api.deleteApp(app.id, token);
      showToast({
        type: 'success',
        title: 'App Permanently Removed',
        description: `"${app.name}" has been deleted from Mabs Store.`,
      });
      onDeleted(app.id);
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message || 'Could not delete application.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-4 text-rose-400">
          <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Delete Application</h3>
            <p className="text-xs text-slate-400">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          Are you sure you want to permanently delete <strong className="text-amber-400">{app.name}</strong> (v{app.version}) by <em>{app.developer}</em> from 🚀 Mabs Store ⚡?
        </p>

        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 mb-6 flex items-center gap-3">
          <img
            src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80'}
            alt=""
            className="w-10 h-10 rounded-lg object-cover bg-slate-800"
          />
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold text-slate-200 truncate">{app.name}</div>
            <div className="text-slate-400 truncate">{app.category} • {app.appSize}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer"
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
