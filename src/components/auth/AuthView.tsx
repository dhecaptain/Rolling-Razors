import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { setView, loginAsCustomer, loginAsAdmin, addToast } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('0712901234');
  const [name, setName] = useState('Brian Mwangi');
  const [email, setEmail] = useState('brian.mwangi@gmail.com');
  const [password, setPassword] = useState('••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsCustomer();
    setView('customer_dashboard');
    addToast('success', 'Karibu!', `Logged in successfully as ${name}.`);
  };

  return (
    <div id="auth-portal-page" className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#073B32] text-[#F5F1E8] px-4 relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-leather-texture opacity-10 pointer-events-none" />

      <div className="w-full max-w-md bg-[#0B4035] border-2 border-[#D6A62E]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Back Button */}
        <button
          onClick={() => setView('website')}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#D6A62E] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
        </button>

        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo variant="light" size="md" showTagline={false} />
          </div>
          <h2 className="text-2xl font-black font-display text-white mt-2">
            {isRegister ? 'Create Driver Account' : 'Driver & Workshop Portal'}
          </h2>
          <p className="text-xs text-white/70">
            {isRegister ? 'Join hundreds of Kenyan vehicle owners' : 'Log in to track jobs, settle M-Pesa deposits & manage vehicles.'}
          </p>
        </div>

        {/* Quick Demo Login One-Click Buttons */}
        <div className="bg-[#073B32] p-3.5 rounded-2xl border border-[#D6A62E]/30 space-y-2">
          <span className="text-[10px] text-[#D6A62E] uppercase font-bold tracking-wider block text-center">
            ⚡ Quick 1-Click Demo Logins
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="demo-login-driver-btn"
              type="button"
              onClick={() => {
                loginAsCustomer();
                setView('customer_dashboard');
              }}
              className="py-2.5 px-3 rounded-xl bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
            >
              <User className="w-3.5 h-3.5 text-[#D6A62E]" />
              <span>Customer Demo</span>
            </button>

            <button
              id="demo-login-admin-btn"
              type="button"
              onClick={() => {
                loginAsAdmin();
                setView('admin_dashboard');
              }}
              className="py-2.5 px-3 rounded-xl bg-[#0B4035] hover:bg-[#D6A62E] hover:text-[#073B32] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#D6A62E]" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block text-white/80 font-bold mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Brian Mwangi"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-white/80 font-bold mb-1">Kenyan Phone Number (Safaricom / Airtel)</label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 font-bold mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#073B32] border border-[#D6A62E]/40 text-white font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#D6A62E] hover:bg-[#c39626] text-[#073B32] font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isRegister ? 'Register & Continue' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Register/Login */}
        <div className="text-center pt-2 border-t border-white/10">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-white/80 hover:text-[#D6A62E] font-medium"
          >
            {isRegister ? 'Already registered? Sign in here' : "Don't have an account? Register now"}
          </button>
        </div>

      </div>
    </div>
  );
};
