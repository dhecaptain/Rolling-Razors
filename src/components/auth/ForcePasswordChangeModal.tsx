import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Blocking modal rendered while a workshop staff account still carries the
 * one-time bootstrap/temporary password. Forces the user to set a real
 * password before any further admin action (server refuses only on the
 * mustChangePassword flag — this UI is the enforcement layer).
 */
export const ForcePasswordChangeModal: React.FC = () => {
  const { currentUser, authFetch, addToast, updateProfile } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser || !currentUser.mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      addToast('error', 'Missing Fields', 'Enter your temporary password and a new password.');
      return;
    }
    if (newPassword.length < 8) {
      addToast('error', 'Password Too Short', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Passwords Do Not Match', 'New password and confirmation must match.');
      return;
    }
    if (newPassword === currentPassword) {
      addToast('error', 'Same Password', 'Choose a new password different from the current one.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateProfile({ mustChangePassword: false });
        addToast('success', 'Password Updated', 'Your workshop password is now active. Welcome aboard.');
      } else {
        addToast('error', 'Update Failed', data.error || 'Could not update the password. Try again.');
      }
    } catch {
      addToast('error', 'Update Failed', 'Server unreachable. Your password was not changed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-ink border-2 border-gold rounded-3xl max-w-md w-full p-6 sm:p-8 text-cream shadow-2xl space-y-5 animate-in fade-in">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold flex items-center justify-center text-gold">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-display">Set a Real Account Password</h2>
              <p className="text-[11px] text-white/60">One-time security passcode detected</p>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-white/80 leading-relaxed">
            <strong className="text-rose-300">You are signed in with a temporary passcode.</strong> For account
            security you must choose a personal password before continuing to the workshop hub.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="force-current-password" className="block text-[11px] font-bold text-white/70 mb-1.5">Temporary Password (as sent to you)</label>
            <div className="relative">
              <input
                id="force-current-password"
                type={showCurrent ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-2.5 pl-3 pr-10 rounded-xl bg-panel border border-white/20 text-white text-sm font-bold placeholder:text-white/30 focus:outline-none focus:border-gold"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} aria-label={showCurrent ? 'Hide temporary password' : 'Show temporary password'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-gold">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="force-new-password" className="block text-[11px] font-bold text-white/70 mb-1.5">New Password (min 8 characters)</label>
            <div className="relative">
              <input
                id="force-new-password"
                type={showNew ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full py-2.5 pl-3 pr-10 rounded-xl bg-panel border border-white/20 text-white text-sm font-bold placeholder:text-white/30 focus:outline-none focus:border-gold"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} aria-label={showNew ? 'Hide new password' : 'Show new password'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-gold">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="force-confirm-password" className="block text-[11px] font-bold text-white/70 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                id="force-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat the new password"
                className="w-full py-2.5 pl-3 pr-10 rounded-xl bg-panel border border-white/20 text-white text-sm font-bold placeholder:text-white/30 focus:outline-none focus:border-gold"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-gold">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-end gap-2">
            <button type="submit" disabled={submitting} className="py-2.5 px-5 rounded-xl bg-gold text-ink font-black text-xs uppercase tracking-wider shadow flex items-center gap-2 disabled:opacity-50 cursor-pointer">
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  Securing Account...
                </>
              ) : (
                'Activate My Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};