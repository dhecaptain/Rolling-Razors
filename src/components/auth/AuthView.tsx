import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { clerkEnabled } from '../../auth/clerkConfig';
import { ClerkAuthPanel } from './ClerkAuthPanel';
import { ArrowLeft, ArrowRight, AlertCircle, Loader2, Mail, Lock, Phone, UserRound } from 'lucide-react';

export const AuthView: React.FC = () => {
  if (clerkEnabled) return <ClerkAuthPanel />;
  const { setView, authInitialMode, authReturnView, loginCustomer, registerCustomer } = useApp();
  const [isRegister, setIsRegister] = useState(authInitialMode === 'register');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState(''); const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); const [errorMessage, setErrorMessage] = useState<string | null>(null); const reduce = useReducedMotion();
  useEffect(() => setIsRegister(authInitialMode === 'register'), [authInitialMode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setIsLoading(true); setErrorMessage(null);
    try {
      const result = isRegister ? await registerCustomer({ name, email, phone, password }) : await loginCustomer(email, password);
      if (!result.success) setErrorMessage(result.error || 'Please check your details and try again.');
    } catch { setErrorMessage('We could not reach the workshop. Please try again.'); } finally { setIsLoading(false); }
  };

  return <motion.main id="auth-portal-page" initial={reduce ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} className="rr-auth-page min-h-screen bg-[#F2EBDD] px-4 py-8 text-[#342A22] sm:px-6 lg:py-14">
    <div className="mx-auto grid min-h-[680px] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#342A22]/15 bg-[#F7F0E4] shadow-[0_28px_90px_rgba(52,42,34,.18)] lg:grid-cols-[1.08fr_.92fr]">
      <motion.section initial={reduce ? { opacity: 1 } : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative hidden min-h-[680px] overflow-hidden bg-[#342A22] lg:block">
        <motion.img src="/images/services/leather-seats.jpg" alt="Crafted leather vehicle interior ready for the road" className="absolute inset-0 h-full w-full object-cover" animate={reduce ? {} : { scale: [1.04, 1.1, 1.04], x: [0, -10, 0] }} transition={reduce ? {} : { duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241B16]/95 via-[#342A22]/35 to-[#342A22]/10" />
        <div className="relative z-10 flex h-full flex-col justify-between p-9 text-[#F2EBDD] xl:p-12"><div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.22em] text-[#D28A50]"><span className="h-px w-8 bg-[#D28A50]" /> Rolling Razors / Driver garage</div><div><p className="mb-4 font-mono text-[10px] uppercase tracking-[.2em] text-[#F2EBDD]/65">Made for the miles ahead</p><h1 className="max-w-lg font-display text-5xl font-black leading-[.94] tracking-[-.06em] xl:text-7xl">Keep your drive moving.</h1><p className="mt-6 max-w-sm text-sm leading-7 text-[#F2EBDD]/75">Save your vehicle details, follow workshop progress, and manage every fitting from one simple garage profile.</p><div className="mt-8 flex gap-2 font-mono text-[10px] uppercase tracking-wider text-[#F2EBDD]/70"><span className="rounded-full border border-[#F2EBDD]/25 px-3 py-2">Private account</span><span className="rounded-full border border-[#D28A50]/50 px-3 py-2">M-Pesa ready</span></div></div></div>
      </motion.section>
      <motion.section initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rr-auth-form flex flex-col justify-center p-6 sm:p-10 lg:p-12">
        <div className="flex items-center justify-between"><button onClick={() => setView(authReturnView)} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#A85F35] hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Back to {authReturnView === 'booking' ? 'booking' : 'website'}</button><span className="font-mono text-[10px] uppercase tracking-wider text-[#342A22]/50">Secure access</span></div>
        <div className="mt-10"><Logo variant="dark" size="sm" showTagline={false} /><p className="rr-label mt-10 text-[#A85F35]">{isRegister ? 'Create your garage profile' : 'Welcome back'}</p><h2 className="mt-3 font-display text-4xl font-black leading-none tracking-[-.05em] text-[#342A22]">{isRegister ? 'Start with your details.' : 'Sign in to your garage.'}</h2><p className="mt-4 max-w-sm text-sm leading-6 text-[#342A22]/65">{isRegister ? 'Your phone number helps us coordinate payment and workshop updates.' : 'Use the email and password linked to your account.'}</p></div>
        {errorMessage && <div className="mt-6 flex items-start gap-2 rounded-xl border border-rose-700/20 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {isRegister && <label className="block"><span className="rr-auth-label"><UserRound /> Full name</span><input id="customer-register-name-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Brian Mwangi" className="rr-control w-full" /></label>}
          <label className="block"><span className="rr-auth-label"><Mail /> Email address</span><input id={isRegister ? 'customer-register-email-input' : 'customer-login-phone-input'} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="rr-control w-full" /></label>
          {isRegister && <label className="block"><span className="rr-auth-label"><Phone /> Phone number for payments</span><input id="customer-register-phone-input" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712 901 234" className="rr-control w-full" /></label>}
          <label className="block"><span className="rr-auth-label"><Lock /> Password</span><input id="customer-login-password-input" type="password" required minLength={isRegister ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="rr-control w-full" /></label>
          <motion.button id="customer-submit-auth-btn" type="submit" disabled={isLoading} whileTap={reduce ? {} : { scale: .98 }} className="rr-button-gold flex w-full cursor-pointer items-center justify-center gap-2 py-3.5 text-xs uppercase tracking-wider disabled:opacity-50">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Please wait</> : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight className="h-4 w-4" /></>}</motion.button>
        </form>
        <div className="mt-7 border-t border-[#342A22]/12 pt-5 text-center text-xs text-[#342A22]/65"><button type="button" onClick={() => { setIsRegister(!isRegister); setErrorMessage(null); }} className="cursor-pointer font-bold text-[#A85F35] hover:underline">{isRegister ? 'Already have an account? Sign in' : 'New customer? Create an account'}</button></div>
      </motion.section>
    </div>
  </motion.main>;
};
