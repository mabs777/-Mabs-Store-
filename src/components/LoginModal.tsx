import React, { useState } from 'react';
import { X, Lock, Shield, Eye, EyeOff, Sparkles, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    const success = await login(password.trim());
    if (success) {
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-login-modal-btn"
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 mx-auto mb-3 shadow-xl shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-100 font-['Outfit',sans-serif]">
            Store Owner Authentication
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Log in to manage apps, publish updates, and edit categories on 🚀 Mabs Store ⚡
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Admin Master Password</span>
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full pl-3.5 pr-10 py-3 rounded-xl text-sm bg-slate-950/80 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100 placeholder-slate-500 font-mono"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
            <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Owner Notice:</strong> Initial default password is <code className="bg-amber-400/20 px-1 py-0.5 rounded text-amber-200 font-mono">admin</code>. You can change this password anytime in the Admin Dashboard settings.
            </div>
          </div>

          <div className="pt-2">
            <button
              id="submit-login-btn"
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Admin Dashboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
