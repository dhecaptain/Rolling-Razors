import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { clerkEnabled } from '../../auth/clerkConfig';
import { ClerkAuthPanel } from './ClerkAuthPanel';
import { ArrowLeft, ArrowRight, AlertCircle, Loader2, Mail, Lock, Phone, UserRound, ShieldCheck } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { setView, authInitialMode, authReturnView, loginCustomer, loginAdmin, registerCustomer } = useApp();
  const [isStaff, setIsStaff] = useState(authInitialMode === 'admin');
  const [isRegister, setIsRegister] = useState(authInitialMode === 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    setIsStaff(authInitialMode === 'admin');
    setIsRegister(authInitialMode === 'register');
  }, [authInitialMode]);

  if (clerkEnabled) return <ClerkAuthPanel admin={isStaff} />;

  const selectAudience = (staff: boolean) => {
    setIsStaff(staff);
    setIsRegister(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = isStaff
        ? await loginAdmin(email, password)
        : isRegister
          ? await registerCustomer({ name, email, phone, password })
          : await loginCustomer(email, password);
      if (!result.success) setErrorMessage(result.error || 'Please check your details and try again.');
    } catch {
      setErrorMessage('We could not reach the workshop. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return <motion.main id="auth-portal-page" initial={reduce ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} className="rr-auth-page min-h-[100dvh] bg-paper px-0 pb-10 pt-24 text-ink sm:px-6 sm:pb-8 sm:pt-24 lg:pb-14 lg:pt-28">
    <div className="mx-auto grid min-h-0 w-full max-w-6xl overflow-hidden border border-ink bg-paper-high shadow-[0_28px_90px_rgba(52,42,34,.18)] sm:rounded-[2rem] lg:min-h-[680px] lg:grid-cols-[1.08fr_.92fr]">
      <motion.section initial={reduce ? { opacity: 1 } : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative hidden min-h-[680px] overflow-hidden bg-ink lg:block">
        <motion.img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85" alt="Sports car moving along an open road" className="absolute inset-0 h-full w-full object-cover" animate={reduce ? {} : { scale: [1.04, 1.1, 1.04], x: [0, -10, 0] }} transition={reduce ? {} : { duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-deep via-ink/80 to-ink/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-16 p-9 text-center text-paper xl:p-12">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.22em] text-gold-bright"><span className="h-px w-8 bg-gold-bright" /> Rolling Razors / Secure access</div>
          <div className="flex flex-col items-center"><p className="mb-4 font-mono text-[10px] uppercase tracking-[.2em]">Made for the miles ahead</p><h1 className="max-w-lg font-display text-5xl font-black leading-[.94] tracking-[-.06em] xl:text-7xl">Good work starts with the right access.</h1><p className="mt-6 max-w-sm text-sm leading-7">Manage your workshop or keep up with your vehicle from one secure sign-in.</p><div className="mt-8 flex justify-center gap-2 font-mono text-[10px] uppercase tracking-wider"><span className="rounded-full border border-paper/40 px-3 py-2">Private account</span><span className="rounded-full border border-gold-bright px-3 py-2">Staff verified</span></div></div>
        </div>
      </motion.section>
      <motion.section initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rr-auth-form flex min-h-[100dvh] flex-col items-center justify-start px-6 pb-10 pt-8 text-center sm:min-h-0 sm:p-10 lg:justify-center lg:p-12">
        <div className="flex w-full max-w-[434px] items-center justify-between"><button type="button" onClick={() => setView(authReturnView)} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-gold hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Back to {authReturnView === 'booking' ? 'booking' : 'website'}</button><span className="font-mono text-[10px] uppercase tracking-wider text-ink">Secure access</span></div>
        <div className="mt-8 flex w-full max-w-[434px] flex-col items-center"><Logo variant="dark" size="sm" showTagline={false} /><p className="rr-label mt-8 text-gold">Rolling Razors account</p><h2 className="mt-3 font-display text-4xl font-black leading-none tracking-[-.05em] text-ink">Sign in</h2><p className="mt-3 max-w-sm text-sm leading-6 text-ink">Choose your account type to continue.</p></div>
        <div className="mt-6 grid w-full max-w-[434px] grid-cols-2 rounded-xl border border-ink/15 bg-white/60 p-1" role="tablist" aria-label="Account type">
          <button type="button" role="tab" aria-selected={!isStaff} onClick={() => selectAudience(false)} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors ${!isStaff ? 'bg-ink text-paper shadow' : 'text-ink/70 hover:bg-ink/5'}`}><UserRound className="h-4 w-4" /> Driver</button>
          <button type="button" role="tab" aria-selected={isStaff} onClick={() => selectAudience(true)} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors ${isStaff ? 'bg-ink text-paper shadow' : 'text-ink/70 hover:bg-ink/5'}`}><ShieldCheck className="h-4 w-4" /> Staff</button>
        </div>
        <div className="mt-4 w-full max-w-[434px] rounded-xl border border-ink/10 bg-paper p-3 text-left text-xs text-ink/75">{isStaff ? 'Staff access is verified separately. Only authorized workshop accounts can open the staff workspace.' : 'Sign in to manage bookings, vehicles, and workshop updates.'}</div>
        {errorMessage && <div role="alert" className="mt-4 flex w-full max-w-[434px] items-start gap-2 rounded-xl border border-rose-700/20 bg-rose-50 p-3 text-left text-xs text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
        <form onSubmit={handleSubmit} className="mt-5 w-full max-w-[434px] space-y-4 text-left" noValidate>
          {isRegister && !isStaff && <label className="block"><span className="rr-auth-label"><UserRound /> Full name</span><input name="name" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Brian Mwangi" className="rr-control w-full" /></label>}
          <label className="block"><span className="rr-auth-label">{isStaff ? <ShieldCheck /> : <Mail />} {isStaff ? 'Staff email or phone' : 'Email address'}</span><input id="unified-auth-identifier" name="username" type={isStaff ? 'text' : 'email'} required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder={isStaff ? 'staff@rollingrazors.co.ke' : 'you@example.com'} aria-invalid={errorMessage ? 'true' : undefined} className="rr-control w-full" /></label>
          {isRegister && !isStaff && <label className="block"><span className="rr-auth-label"><Phone /> Phone number for payments</span><input name="tel" type="tel" required autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712 901 234" className="rr-control w-full" /></label>}
          <label className="block"><span className="rr-auth-label"><Lock /> Password</span><input name="password" type="password" required minLength={isRegister && !isStaff ? 8 : undefined} autoComplete={isRegister && !isStaff ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" aria-invalid={errorMessage ? 'true' : undefined} className="rr-control w-full" /></label>
          <motion.button type="submit" disabled={isLoading} whileTap={reduce ? {} : { scale: .98 }} className="rr-button-gold flex min-h-12 w-full items-center justify-center gap-2 disabled:opacity-50">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Please wait</> : <>{isStaff ? 'Staff sign in' : isRegister ? 'Create driver account' : 'Driver sign in'} <ArrowRight className="h-4 w-4" /></>}</motion.button>
        </form>
        {!isStaff && <div className="mt-6 w-full max-w-[434px] border-t border-ink/10 pt-5 text-center text-xs text-ink"><button type="button" onClick={() => { setIsRegister(!isRegister); setErrorMessage(null); }} className="min-h-10 font-bold text-gold hover:underline">{isRegister ? 'Already have an account? Sign in' : 'New customer? Create an account'}</button></div>}
      </motion.section>
    </div>
  </motion.main>;
};
