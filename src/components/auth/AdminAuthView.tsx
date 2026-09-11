import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { clerkEnabled } from '../../auth/clerkConfig';
import { ClerkAuthPanel } from './ClerkAuthPanel';
import { ShieldAlert, Lock, ArrowRight, ArrowLeft, KeyRound, Loader2, AlertCircle, Smartphone } from 'lucide-react';

export const AdminAuthView: React.FC = () => {
  if (clerkEnabled) return <ClerkAuthPanel admin />;
  const { setView, loginAdmin, addToast } = useApp();
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [otp, setOtp] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [pendingIdentifier, setPendingIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginAdmin(adminIdentifier, adminPasscode);
      if (!res.success) {
        if ((res as any).requiresOtp) {
          setRequiresOtp(true);
          setPendingIdentifier(adminIdentifier);
          setErrorMessage(null);
          addToast('info', 'OTP Sent', 'Enter the 6-digit code sent to workshop phone.');
        } else {
          setErrorMessage(res.error || 'Invalid admin credentials.');
        }
      }
    } catch {
      setErrorMessage('Admin verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const identifier = pendingIdentifier || adminIdentifier;
      const res = await fetch('/api/auth/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.error || 'Invalid OTP.');
      } else {
        const sessionData = { user: data.user, token: data.token, expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
        localStorage.setItem('rr_auth_session', JSON.stringify(sessionData));
        window.location.reload();
      }
    } catch {
      setErrorMessage('OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="admin-auth-page" className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#073B32] text-[#F5F1E8] px-4 relative">
      <div className="absolute inset-0 bg-leather-texture opacity-10 pointer-events-none" />
      <div className="w-full max-w-md bg-[#0B4035] border-2 border-[#D6A62E]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('website')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D6A62E] hover:underline cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </button>
          <span className="text-[11px] text-white/50 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#25D366]" /> Workshop Isolated
          </span>
        </div>
        <div className="text-center space-y-2">
          <div className="flex justify-center"><Logo variant="light" size="md" showTagline={false} /></div>
          <h2 className="text-2xl font-black font-display text-white mt-2">Workshop Operations Hub</h2>
          <p className="text-xs text-white/70">Restricted to authorized Rolling Razors staff. Separate isolated login — customer credentials not accepted here.</p>
          <p className="text-[11px] text-amber-300/80">RBAC pending: Casbin will enforce reception/manager/craftsman soon.</p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {!requiresOtp ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
            <div className="bg-[#052822] p-3 rounded-xl border border-[#D6A62E]/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[#D6A62E] font-bold"><KeyRound className="w-3.5 h-3.5" /><span>Staff Verification</span></div>
              <p className="text-[11px] text-white/70">Admin credentials are verified server-side with bcrypt + optional 2FA. Rate-limited 5/min.</p>
            </div>
            <div>
              <label className="block text-white/80 font-bold mb-1">Staff Identifier (Email or Phone)</label>
              <input id="admin-identifier-input" type="text" required value={adminIdentifier} onChange={e=>setAdminIdentifier(e.target.value)} placeholder="staff@rollingrazors.co.ke" className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E]" />
            </div>
            <div>
              <label className="block text-white/80 font-bold mb-1">Security Passcode</label>
              <input id="admin-passcode-input" type="password" required value={adminPasscode} onChange={e=>setAdminPasscode(e.target.value)} placeholder="••••••••" className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E] font-mono" />
            </div>
            <button id="admin-submit-auth-btn" type="submit" disabled={isLoading} className="w-full py-3.5 rounded-xl bg-[#00A859] hover:bg-[#00914d] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></> : <><ShieldAlert className="w-4 h-4" /><span>Authorize & Open Admin Hub</span></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4 text-xs">
            <div className="bg-[#052822] p-3 rounded-xl border border-emerald-500/30 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-white/80">Enter 6-digit OTP sent to workshop phone</span>
            </div>
            <div>
              <label className="block text-white/80 font-bold mb-1">One-Time Code</label>
              <input id="admin-otp-input" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="123456" className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-emerald-500/40 text-white font-mono font-bold text-center text-lg tracking-widest placeholder-white/30 focus:outline-none focus:border-emerald-500" />
            </div>
            <button type="submit" disabled={isLoading || otp.length!==6} className="w-full py-3.5 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></> : <span>Verify OTP & Enter</span>}
            </button>
            <button type="button" onClick={()=>{setRequiresOtp(false); setOtp(''); setErrorMessage(null);}} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold">Back to Passcode</button>
          </form>
        )}
      </div>
    </div>
  );
};
