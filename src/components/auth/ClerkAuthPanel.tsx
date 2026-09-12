import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
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
  const { setView, currentUser, isLoggedIn } = useApp();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

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
    <div
      id={admin ? 'admin-auth-page' : 'auth-portal-page'}
      className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#073B32] text-[#F5F1E8] px-4 relative"
    >
      <div className="absolute inset-0 bg-leather-texture opacity-10 pointer-events-none" />
      <div className="w-full max-w-md relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('website')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D6A62E] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </button>
          <span className="text-[11px] text-white/50 font-mono flex items-center gap-1">
            {admin ? <><Lock className="w-3 h-3 text-[#25D366]" /> Workshop Isolated</> : <><Lock className="w-3 h-3 text-[#25D366]" /> Secured by Clerk</>}
          </span>
        </div>

        <div className="flex justify-center">
          <Logo variant="light" size="md" showTagline={false} />
        </div>

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

        <div className="rounded-2xl border border-[#D6A62E]/25 bg-[#0B4035] p-5 sm:p-6 shadow-2xl">
          {mode === 'signIn' ? (
            <SignIn routing="hash" appearance={clerkAppearance} />
          ) : (
            <SignUp routing="hash" appearance={clerkAppearance} />
          )}
        </div>

        {!admin && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'))}
              className="text-xs text-white/80 hover:text-[#D6A62E] font-semibold cursor-pointer"
            >
              {mode === 'signIn'
                ? 'New customer? Create your account'
                : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
