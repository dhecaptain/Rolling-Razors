import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { ArrowLeft, ShieldAlert, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';

interface ClerkAuthPanelProps {
  admin?: boolean;
}

/**
 * Clerk-powered authentication panel rendered when the Clerk provider is active.
 * Uses virtual routing so it does not depend on a client-side router.
 */
export const ClerkAuthPanel: React.FC<ClerkAuthPanelProps> = ({ admin = false }) => {
  const { setView } = useApp();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

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

        <div className="flex justify-center">
          {mode === 'signIn' ? (
            <SignIn
              routing="hash"
              appearance={{ variables: { colorPrimary: '#D6A62E', colorBackground: '#0B4035' } }}
            />
          ) : (
            <SignUp
              routing="hash"
              appearance={{ variables: { colorPrimary: '#D6A62E', colorBackground: '#0B4035' } }}
            />
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
