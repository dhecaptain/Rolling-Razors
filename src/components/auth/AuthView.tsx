import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { clerkEnabled } from '../../auth/clerkConfig';
import { ClerkAuthPanel } from './ClerkAuthPanel';
import {
  User,
  Lock,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const AuthView: React.FC = () => {
  if (clerkEnabled) return <ClerkAuthPanel />;
  const {
    setView,
    authInitialMode,
    authReturnView,
    loginCustomer,
    registerCustomer,
  } = useApp();

  const [isRegister, setIsRegister] = useState(false);
  
  // Customer inputs
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (authInitialMode === 'register') {
      setIsRegister(true);
    } else {
      setIsRegister(false);
    }
  }, [authInitialMode]);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isRegister) {
        const res = await registerCustomer({
          name,
          phone,
          email,
          password: customerPassword
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Registration failed');
        }
      } else {
        const res = await loginCustomer(phone, customerPassword);
        if (!res.success) {
          setErrorMessage(res.error || 'Authentication failed');
        }
      }
    } catch {
      setErrorMessage('An unexpected error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div id="auth-portal-page" initial={reduce ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#073B32] px-4 pb-16 pt-24 text-[#F5F1E8]">
      <div className="pointer-events-none absolute inset-0 bg-leather-texture opacity-10" />
      <motion.div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-[#D6A62E]/10 blur-3xl" animate={reduce ? {} : { x: [0, 28, 0], y: [0, -18, 0] }} transition={reduce ? {} : { duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="relative z-10 grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[.85fr_1fr]">
        <motion.div initial={reduce ? { opacity: 1 } : { opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={reduce ? {} : { duration: .7 }} className="hidden lg:block">
          <p className="rr-label text-[#D6A62E]">Driver access</p>
          <h1 className="mt-5 max-w-md text-5xl font-black leading-[.98] tracking-[-.05em] text-[#F5F1E8]">Your next interior starts here.</h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[#F5F1E8]/65">Sign in to keep your vehicle details, follow workshop progress, and manage every Rolling Razors booking from one calm dashboard.</p>
          <div className="mt-8 flex gap-2 text-[11px] font-bold text-[#F5F1E8]/70">
            <span className="rounded-full border border-[#D6A62E]/30 bg-[#0B4035]/60 px-3 py-2">Secure account</span>
            <span className="rounded-full border border-[#F5F1E8]/15 bg-[#0B4035]/60 px-3 py-2">M-Pesa ready</span>
          </div>
        </motion.div>
        <motion.div initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={reduce ? {} : { duration: .7, ease: [0.22, 1, .36, 1] }} className="rr-md-card w-full max-w-md justify-self-center border border-[#D6A62E]/35 bg-[#0B4035]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,.3)] backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between">
          <button onClick={() => setView(authReturnView)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D6A62E] hover:underline cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {authReturnView === 'booking' ? 'Booking' : 'Website'}
          </button>
          <span className="text-[11px] text-white/50 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#25D366]" /> SSL Secured
          </span>
        </div>
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo variant="light" size="md" showTagline={false} />
          </div>
          <h2 className="text-2xl font-black font-display text-white mt-2">
            {isRegister ? 'Create Driver Account' : 'Driver Portal Sign In'}
          </h2>
          <p className="text-xs text-white/70">
            {isRegister ? 'Join Kenyan vehicle owners managing custom leather & upholstery jobs.' : 'Track job stitching status, view invoices, and settle M-Pesa deposits.'}
          </p>
          <p className="text-[11px] text-white/40">Workshop staff? <button onClick={()=>setView('admin_auth' as any)} className="text-[#D6A62E] underline">Sign in to Workshop Hub →</button></p>
        </div>

        {errorMessage && (
          <motion.div initial={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </motion.div>
        )}

        <motion.form initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? {} : { duration: .35 }} onSubmit={handleCustomerSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <div>
                <label className="block text-white/80 font-bold mb-1">Full Name</label>
                <input
                  id="customer-register-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Brian Mwangi"
                  className="rr-control w-full px-3.5 text-white font-bold placeholder-white/30"
                />
              </div>
            )}

            <div>
              <label className="block text-white/80 font-bold mb-1">
                Kenyan Phone Number (M-Pesa registered)
              </label>
              <div className="relative">
                <input
                  id="customer-login-phone-input"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 901 234"
                  className="rr-control w-full px-3.5 text-white font-bold placeholder-white/30 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhone('0712 901 234');
                  setCustomerPassword('1234');
                }}
                className="text-[11px] text-[#D6A62E] hover:text-amber-200 hover:underline mt-1 block cursor-pointer font-medium"
              >
                Demo driver: <strong className="font-mono">0712 901 234</strong> (click to auto-fill)
              </button>
            </div>

            {isRegister && (
              <div>
                <label className="block text-white/80 font-bold mb-1">Email Address</label>
                <input
                  id="customer-register-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="brian.mwangi@gmail.com"
                  className="rr-control w-full px-3.5 text-white font-bold placeholder-white/30"
                />
              </div>
            )}

            <div>
              <label className="block text-white/80 font-bold mb-1">Password / PIN</label>
              <input
                id="customer-login-password-input"
                type="password"
                required
                value={customerPassword}
                onChange={(e) => setCustomerPassword(e.target.value)}
                placeholder="••••••••"
                className="rr-control w-full px-3.5 text-white font-bold placeholder-white/30"
              />
            </div>

            <motion.button
              id="customer-submit-auth-btn"
              type="submit"
              disabled={isLoading}
              whileHover={isLoading || reduce ? {} : { y: -2, boxShadow: '0 12px 26px rgba(214,166,46,.2)' }}
              whileTap={isLoading || reduce ? {} : { scale: .98 }}
              className="rr-button-gold w-full py-3.5 text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Register & Enter Portal' : 'Authenticate & Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Toggle Register / Login */}
            <div className="text-center pt-2 border-t border-white/10">
              <motion.button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMessage(null);
                }}
                whileHover={reduce ? {} : { y: -1 }}
                className="text-xs text-white/80 hover:text-[#D6A62E] font-semibold cursor-pointer"
              >
                {isRegister 
                  ? 'Already have a driver account? Sign in here' 
                  : "New customer? Create your vehicle garage profile"}
              </motion.button>
            </div>
        </motion.form>
      </motion.div>
      </div>
    </motion.div>
  );
};
