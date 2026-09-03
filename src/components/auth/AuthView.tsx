import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { 
  User, 
  ShieldAlert, 
  Lock, 
  Phone, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  ArrowLeft,
  KeyRound,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { 
    setView, 
    authInitialMode, 
    loginCustomer, 
    loginAdmin, 
    registerCustomer,
    addToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [isRegister, setIsRegister] = useState(false);
  
  // Customer inputs
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');

  // Admin inputs
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authInitialMode === 'admin') {
      setActiveTab('admin');
      setIsRegister(false);
    } else if (authInitialMode === 'register') {
      setActiveTab('customer');
      setIsRegister(true);
    } else {
      setActiveTab('customer');
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

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginAdmin(adminIdentifier, adminPasscode);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid admin credentials or security passcode.');
      }
    } catch {
      setErrorMessage('Admin verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-portal-page" className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#073B32] text-[#F5F1E8] px-4 relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-leather-texture opacity-10 pointer-events-none" />

      <div className="w-full max-w-md bg-[#0B4035] border-2 border-[#D6A62E]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('website')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D6A62E] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </button>
          <span className="text-[11px] text-white/50 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#25D366]" /> SSL Secured
          </span>
        </div>

        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo variant="light" size="md" showTagline={false} />
          </div>
          <h2 className="text-2xl font-black font-display text-white mt-2">
            {activeTab === 'admin' 
              ? 'Workshop Operations Hub' 
              : isRegister 
                ? 'Create Driver Account' 
                : 'Driver Portal Sign In'}
          </h2>
          <p className="text-xs text-white/70">
            {activeTab === 'admin'
              ? 'Restricted to authorized Rolling Razors workshop management & craftsmen.'
              : isRegister 
                ? 'Join Kenyan vehicle owners managing custom leather & upholstery jobs.'
                : 'Track job stitching status, view invoices, and settle M-Pesa deposits.'}
          </p>
        </div>

        {/* Role Portal Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#073B32] rounded-2xl border border-white/10">
          <button
            id="tab-select-customer-auth"
            type="button"
            onClick={() => {
              setActiveTab('customer');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-[#D6A62E] text-[#073B32] shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Driver / Customer</span>
          </button>

          <button
            id="tab-select-admin-auth"
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[#D6A62E] text-[#073B32] shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Workshop Admin</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: CUSTOMER FORM */}
        {activeTab === 'customer' && (
          <form onSubmit={handleCustomerSubmit} className="space-y-4 text-xs">
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
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E]"
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
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E] font-mono"
                />
              </div>
              <span className="text-[10px] text-[#D6A62E] mt-1 block">
                Default prototype customer: <strong className="font-mono">0712 901 234</strong>
              </span>
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
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E]"
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
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E]"
              />
            </div>

            <button
              id="customer-submit-auth-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
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
            </button>

            {/* Toggle Register / Login */}
            <div className="text-center pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMessage(null);
                }}
                className="text-xs text-white/80 hover:text-[#D6A62E] font-semibold cursor-pointer"
              >
                {isRegister 
                  ? 'Already have a driver account? Sign in here' 
                  : "New customer? Create your vehicle garage profile"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: WORKSHOP ADMIN ACCESS */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
            <div className="bg-[#052822] p-3 rounded-xl border border-[#D6A62E]/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[#D6A62E] font-bold">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Role-Based Access Verification</span>
              </div>
              <p className="text-[11px] text-white/70">
                Authorized staff accounts only. Valid credentials grant JWT admin session tokens.
              </p>
            </div>

            <div>
              <label className="block text-white/80 font-bold mb-1">
                Workshop Staff Identifier (Email or Phone)
              </label>
              <input
                id="admin-identifier-input"
                type="text"
                required
                value={adminIdentifier}
                onChange={(e) => setAdminIdentifier(e.target.value)}
                placeholder="james@rollingrazors.co.ke"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E]"
              />
              <span className="text-[10px] text-[#D6A62E] mt-1 block">
                Authorized staff email: <strong className="font-mono">james@rollingrazors.co.ke</strong>
              </span>
            </div>

            <div>
              <label className="block text-white/80 font-bold mb-1">
                Workshop Security Passcode
              </label>
              <input
                id="admin-passcode-input"
                type="password"
                required
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Passcode"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold placeholder-white/30 focus:outline-none focus:border-[#D6A62E] font-mono"
              />
              <span className="text-[10px] text-[#D6A62E] mt-1 block">
                Master workshop passcode: <strong className="font-mono">admin123</strong>
              </span>
            </div>

            <button
              id="admin-submit-auth-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#00A859] hover:bg-[#00914d] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Role Access...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Authorize & Open Admin Hub</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

