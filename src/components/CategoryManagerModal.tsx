import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, Sparkles, FolderPlus } from 'lucide-react';
import type { CategoryItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onCategoryAdded: (newCat: CategoryItem) => void;
  onCategoryDeleted: (catId: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoryAdded,
  onCategoryDeleted,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !token) return;

    try {
      setIsSubmitting(true);
      const cat = await api.addCategory(
        {
          name: newCatName.trim(),
          description: newCatDesc.trim(),
        },
        token
      );
      showToast({
        type: 'success',
        title: 'Category Added',
        description: `Category "${cat.name}" has been registered.`,
      });
      onCategoryAdded(cat);
      setNewCatName('');
      setNewCatDesc('');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Add Category',
        description: err.message || 'An error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId: string, name: string) => {
    if (!token) return;
    try {
      await api.deleteCategory(catId, token);
      showToast({
        type: 'success',
        title: 'Category Removed',
        description: `Category "${name}" was deleted.`,
      });
      onCategoryDeleted(catId);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message || 'Could not delete category.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-['Outfit',sans-serif]">
                Category Management
              </h3>
              <p className="text-xs text-slate-400">Add or manage store classification categories</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="pt-4 pb-4 border-b border-slate-800 space-y-3 shrink-0">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Add New Store Category
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Category Name</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. 🎵 Audio & Music"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Description (Optional)</label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Brief category summary"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newCatName.trim()}
            className="w-full py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </button>
        </form>

        {/* Existing Categories List */}
        <div className="overflow-y-auto py-3 space-y-2 flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Existing Store Categories ({categories.length})
          </div>

          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-slate-200">{cat.name}</div>
                {cat.description && (
                  <div className="text-[11px] text-slate-400 truncate">{cat.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
