import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { clerkEnabled } from '../../auth/clerkConfig';
import { ClerkAuthPanel } from './ClerkAuthPanel';
import { ShieldAlert, Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export const AdminAuthView: React.FC = () => {
  if (clerkEnabled) return <ClerkAuthPanel admin />;
  const { setView, loginAdmin } = useApp();
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginAdmin(adminIdentifier, adminPasscode);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid admin credentials.');
      }
    } catch {
      setErrorMessage('Admin verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="admin-auth-page" className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-ink text-cream px-4 relative">
      <div className="absolute inset-0 bg-leather-texture opacity-10 pointer-events-none" />
      <div className="w-full max-w-md bg-panel border-2 border-gold rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('website')} className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:underline cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </button>
          <span className="text-[11px] text-white/50 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3 text-whatsapp" /> Workshop Isolated
          </span>
        </div>
        <div className="text-center space-y-2">
          <div className="flex justify-center"><Logo variant="light" size="md" showTagline={false} /></div>
          <h2 className="text-2xl font-black font-display text-white mt-2">Workshop Operations Hub</h2>
          <p className="text-xs text-white/70">Restricted to authorized Rolling Razors staff. Separate isolated login — customer credentials not accepted here.</p>
        </div>

        {errorMessage && (
          <div role="alert" className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
          <div className="bg-ink-deep p-3 rounded-xl border border-gold space-y-1.5">
            <div className="flex items-center justify-between text-gold">
              <div className="flex items-center gap-1.5 font-bold"><ShieldAlert className="w-3.5 h-3.5" /><span>Staff Verification</span></div>
            </div>
            <p className="text-[11px] text-white/70">Credentials are verified server-side. Passwords are never stored in plaintext.</p>
          </div>
          <div>
            <label className="block text-white/80 font-bold mb-1">Staff Identifier (Email or Phone)</label>
            <input id="admin-identifier-input" name="identifier" type="text" required autoComplete="username" value={adminIdentifier} onChange={e=>setAdminIdentifier(e.target.value)} placeholder="staff@rollingrazors.co.ke" aria-invalid={errorMessage ? 'true' : undefined} className="w-full py-2.5 px-3.5 rounded-xl bg-ink border border-gold text-white font-bold placeholder-white/30" />
          </div>
          <div>
            <label className="block text-white/80 font-bold mb-1">Security Passcode</label>
            <input id="admin-passcode-input" name="password" type="password" required autoComplete="current-password" value={adminPasscode} onChange={e=>setAdminPasscode(e.target.value)} placeholder="••••••••" aria-invalid={errorMessage ? 'true' : undefined} className="w-full py-2.5 px-3.5 rounded-xl bg-ink border border-gold text-white font-bold placeholder-white/30 font-mono" />
          </div>
          <button id="admin-submit-auth-btn" type="submit" disabled={isLoading} className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-ink font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></> : <><ShieldAlert className="w-4 h-4" /><span>Authorize & Open Admin Hub</span></>}
          </button>
        </form>
      </div>
    </div>
  );
};