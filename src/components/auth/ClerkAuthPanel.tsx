import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ShieldAlert, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';

interface ClerkAuthPanelProps {
  admin?: boolean;
}

/**
 * Branded Clerk appearance so the auth UI matches the Rolling Razors identity
 * (forest green + gold + cream) instead of Clerk's default light card.
 * Variable names follow Clerk v6 (@clerk/react): colorForeground, colorInput, etc.
 */
const clerkAppearance = {
  variables: {
    colorPrimary: '#D6A62E',
    colorPrimaryForeground: '#073B32',
    colorBackground: 'transparent',
    colorForeground: '#F5F1E8',
    colorMuted: '#0B4035',
    colorMutedForeground: 'rgba(245,241,232,0.65)',
    colorInput: '#073B32',
    colorInputForeground: '#F5F1E8',
    colorBorder: 'rgba(214,166,46,0.35)',
    colorRing: '#D6A62E',
    colorDanger: '#fb7185',
    colorSuccess: '#25D366',
    colorWarning: '#fbbf24',
    colorShadow: 'rgba(0,0,0,0.45)',
    borderRadius: '0.75rem',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    fontFamilyButtons: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: '0.875rem',
  },
  options: {
    elevation: 'flush',
    logoPlacement: 'none',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full bg-transparent shadow-none',
    card: 'bg-transparent shadow-none border-0 p-0 gap-5',
    // We render our own branded heading + mode toggle below, so hide Clerk's
    // duplicate header and its "Sign up / Sign in" footer action link.
    header: { display: 'none' },
    footerAction: { display: 'none' },
    main: 'gap-4',
    // Social buttons — explicit colors for reliable contrast on the dark panel.
    socialButtonsRoot: 'gap-2',
    socialButtonsBlockButton: {
      backgroundColor: '#073B32',
      borderColor: 'rgba(255,255,255,0.12)',
      color: '#F5F1E8',
    },
    socialButtonsBlockButtonText: { color: '#F5F1E8', fontWeight: '600' },
    socialButtonsProviderIcon: { opacity: '0.9' },
    // Divider
    dividerLine: 'bg-white/10',
    dividerText: 'text-white/40 text-[11px] uppercase tracking-wider',
    // Fields
    formFieldLabel: 'text-[#D6A62E] font-bold text-[11px] uppercase tracking-wider',
    formFieldInput:
      'bg-[#073B32] border border-[#D6A62E]/40 text-[#F5F1E8] placeholder-white/30 focus:border-[#D6A62E]',
    formFieldInputShowPasswordButton: 'text-white/50 hover:text-[#D6A62E]',
    formFieldAction: 'text-[#D6A62E] hover:text-[#F5F1E8] text-xs font-semibold',
    // Primary button
    formButtonPrimary:
      'bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg normal-case',
    formButtonReset: 'text-[#D6A62E]',
    // Identity / OTP
    identityPreview: 'bg-[#073B32] border border-white/10',
    identityPreviewText: 'text-[#F5F1E8] font-medium',
    identityPreviewEditButton: 'text-[#D6A62E] hover:text-[#F5F1E8]',
    otpCodeFieldInput: 'bg-[#073B32] border-[#D6A62E]/40 text-[#F5F1E8]',
    // Feedback
    alert: 'bg-rose-500/15 border border-rose-500/40',
    alertText: 'text-rose-300',
    // Footer / links
    footer: 'bg-transparent',
    footerActionText: 'text-white/60',
    footerActionLink: 'text-[#D6A62E] hover:text-[#F5F1E8] font-bold',
    footerPagesLink: 'text-white/50 hover:text-[#D6A62E]',
    backLink: 'text-[#D6A62E] hover:text-[#F5F1E8] text-xs font-semibold',
  },
} as const;

/**
 * Clerk-powered authentication panel rendered when the Clerk provider is active.
 * Uses hash routing so it does not depend on a client-side router.
 */
export const ClerkAuthPanel: React.FC<ClerkAuthPanelProps> = ({ admin = false }) => {
  const { setView, currentUser, isLoggedIn, authReturnView } = useApp();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const reduce = useReducedMotion();

  // A signed-in customer must never be presented the workshop (admin) sign-in.
  if (admin && isLoggedIn && currentUser && currentUser.role !== 'admin') {
    return (
      <div
        id="admin-auth-page"
        className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#073B32] text-[#F5F1E8] px-4 relative"
      >
        <div className="absolute inset-0 bg-leather-texture opacity-10 pointer-events-none" />
        <div className="w-full max-w-md bg-[#0B4035] border-2 border-rose-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">Access Restricted</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            Your current account is not authorized for the workshop area. Only authorized Rolling Razors staff can access the Workshop Hub.
          </p>
          <button
            onClick={() => setView('customer_dashboard')}
            className="w-full py-3 rounded-xl bg-[#D6A62E] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Return to Driver Portal</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      id={admin ? 'admin-auth-page' : 'auth-portal-page'}
      initial={reduce ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#073B32] px-4 pb-16 pt-24 text-[#F5F1E8]"
    >
      <div className="pointer-events-none absolute inset-0 bg-leather-texture opacity-10" />
      <motion.div aria-hidden="true" className="pointer-events-none absolute -left-28 top-24 h-72 w-72 rounded-full bg-[#D6A62E]/10 blur-3xl" animate={reduce ? {} : { x: [0, 35, 0], y: [0, -20, 0] }} transition={reduce ? {} : { duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full border border-[#D6A62E]/15" animate={reduce ? {} : { rotate: 360 }} transition={reduce ? {} : { duration: 32, repeat: Infinity, ease: 'linear' }} />
      <div className="relative z-10 grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[.85fr_1fr]">
        <motion.div initial={reduce ? { opacity: 1 } : { opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={reduce ? {} : { duration: .7, ease: [0.22, 1, .36, 1] }} className="hidden lg:block">
          <p className="rr-label text-[#D6A62E]">{admin ? 'Workshop access' : 'Your vehicle, your account'}</p>
          <h1 className="mt-5 max-w-md text-5xl font-black leading-[.98] tracking-[-.05em] text-[#F5F1E8]">
            {admin ? 'Keep the workshop moving.' : 'Your next interior starts here.'}
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[#F5F1E8]/65">
            {admin ? 'A secure workspace for managing appointments, work orders, materials, and customer handoffs.' : 'Sign in once to save your build direction, follow workshop progress, and keep every booking in one place.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-[11px] font-bold text-[#F5F1E8]/70">
            <span className="rounded-full border border-[#D6A62E]/30 bg-[#0B4035]/60 px-3 py-2">Encrypted session</span>
            <span className="rounded-full border border-[#F5F1E8]/15 bg-[#0B4035]/60 px-3 py-2">{admin ? 'Staff only' : 'Booking continuity'}</span>
          </div>
        </motion.div>
        <div className="w-full max-w-md justify-self-center lg:max-w-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView(authReturnView)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D6A62E] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {authReturnView === 'booking' ? 'Booking' : 'Website'}
          </button>
          <span className="text-[11px] text-white/50 font-mono flex items-center gap-1">
            {admin ? <><Lock className="w-3 h-3 text-[#25D366]" /> Workshop Isolated</> : <><Lock className="w-3 h-3 text-[#25D366]" /> Secured by Clerk</>}
          </span>
        </div>

        <motion.div initial={reduce ? { opacity: 1 } : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? {} : { duration: .55 }} className="flex justify-center">
          <Logo variant="light" size="md" showTagline={false} />
        </motion.div>

        {admin ? (
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black font-display text-white">Workshop Operations Hub</h2>
            <p className="text-xs text-white/70 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Restricted to authorized Rolling Razors staff.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black font-display text-white">
              {mode === 'signIn' ? 'Driver Portal Sign In' : 'Create Driver Account'}
            </h2>
            <p className="text-xs text-white/70">
              Track stitching status, view invoices, and settle M-Pesa deposits.
            </p>
          </div>
        )}

        {!admin && (
          <div className="mx-auto mt-5 flex w-full max-w-xs rounded-2xl border border-white/10 bg-[#073B32]/80 p-1.5" role="tablist" aria-label="Authentication mode">
            {(['signIn', 'signUp'] as const).map((option) => (
              <motion.button
                key={option}
                type="button"
                role="tab"
                aria-selected={mode === option}
                onClick={() => setMode(option)}
                whileTap={reduce ? {} : { scale: 0.98 }}
                className={`relative flex-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${mode === option ? 'text-[#073B32]' : 'text-white/55 hover:text-white'}`}
              >
                {mode === option && (
                  <motion.span layoutId="auth-mode-pill" className="absolute inset-0 rounded-xl bg-[#D6A62E]" transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
                )}
                <span className="relative z-10">{option === 'signIn' ? 'Sign in' : 'Create account'}</span>
              </motion.button>
            ))}
          </div>
        )}

        <div className="relative overflow-hidden rounded-[28px] border border-[#D6A62E]/30 bg-[#0B4035]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,.3)] backdrop-blur-xl sm:p-7">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode} initial={reduce ? { opacity: 1 } : { opacity: 0, x: mode === 'signIn' ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: mode === 'signIn' ? 16 : -16 }} transition={reduce ? { duration: 0 } : { duration: .28, ease: [0.22, 1, .36, 1] }}>
              {mode === 'signIn' ? <SignIn routing="hash" appearance={clerkAppearance} /> : <SignUp routing="hash" appearance={clerkAppearance} />}
            </motion.div>
          </AnimatePresence>
        </div>

        </div>
      </div>
    </motion.div>
  );
};
