import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X, UserRound, ShieldAlert, Car, ChevronDown, LogOut } from 'lucide-react';
import { useApp, canAccessAdmin } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { BUSINESS_CONFIG } from '../../config/business';

const NAV_ITEMS = [
  ['Services', 'services-section'],
  ['Build spec', 'spec-section'],
  ['How it works', 'booking-route'],
  ['Our work', 'portfolio-section'],
  ['Workshop', 'arrival-section'],
] as const;

export const Navbar: React.FC = () => {
  const {
    view,
    setView,
    setCustomerTab,
    setAdminTab,
    isLoggedIn,
    currentUser,
    openAuth,
    logout,
    setBookingWizardInitialServiceId,
  } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goHome = () => {
    setMobileMenuOpen(false);
    setView('website');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (view !== 'website') {
      setView('website');
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const startBooking = () => {
    setBookingWizardInitialServiceId(null);
    setView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`sticky top-0 z-40 h-[78px] border-b border-[#D6A62E]/25 bg-[#052822] transition-shadow ${isScrolled ? 'shadow-[0_12px_28px_rgba(0,0,0,.18)]' : ''}`}>
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-6 px-5 lg:px-10">
        <button type="button" onClick={goHome} aria-label="Rolling Razors Customs home" className="rr-header-brand flex min-h-11 shrink-0 items-center text-left">
          <Logo variant="light" size="sm" showTagline />
        </button>

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-[12px] font-semibold text-[#F5F1E8]/75 lg:flex">
          {NAV_ITEMS.map(([label, id]) => (
            <button key={id} type="button" onClick={() => scrollToSection(id)} className="min-h-11 transition-colors hover:text-[#D6A62E]">{label}</button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {isLoggedIn && currentUser ? (
            <button id="header-active-dashboard-link-btn" type="button" onClick={() => setView(canAccessAdmin(currentUser.role) ? 'admin_dashboard' : 'customer_dashboard')} className="hidden items-center gap-2 border border-[#F5F1E8]/25 px-4 py-2 text-[11px] font-bold text-[#F5F1E8] transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E] md:inline-flex">
              {canAccessAdmin(currentUser.role) ? <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" /> : <Car aria-hidden="true" className="h-3.5 w-3.5" />}
              {canAccessAdmin(currentUser.role) ? 'Workshop hub' : 'Driver garage'}
            </button>
          ) : (
            <>
              <button id="nav-driver-signin-btn" type="button" onClick={() => openAuth('customer')} className="hidden min-h-11 items-center gap-2 border border-[#F5F1E8]/25 px-4 py-2 text-[12px] font-bold text-[#F5F1E8] transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E] md:inline-flex"><UserRound aria-hidden="true" className="h-3.5 w-3.5" />Driver sign in</button>
              <button id="nav-workshop-staff-btn" type="button" onClick={() => openAuth('admin')} aria-label="Workshop staff sign in" title="Workshop staff sign in" className="inline-flex h-11 w-11 items-center justify-center border border-[#F5F1E8]/15 text-[#F5F1E8]/65 transition-colors hover:border-[#D6A62E] hover:text-[#D6A62E]"><ShieldAlert aria-hidden="true" className="h-4 w-4" /></button>
            </>
          )}
          <button type="button" onClick={startBooking} className="inline-flex h-11 items-center gap-2 bg-[#D6A62E] px-4 text-[12px] font-black tracking-[.08em] text-[#073B32] transition-colors hover:bg-[#e0b340]">BOOK A FITTING <ArrowUpRightIcon /></button>
          {isLoggedIn && currentUser && (
            <div className="relative">
              <button id="user-profile-menu-btn" type="button" onClick={() => setAuthDropdownOpen((open) => !open)} aria-expanded={authDropdownOpen} className="flex h-10 items-center gap-2 border border-[#F5F1E8]/15 px-2 text-[11px] text-[#F5F1E8]">
                <span className="grid h-6 w-6 place-items-center bg-[#D6A62E] text-[10px] font-black text-[#073B32]">{currentUser.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden max-w-[80px] truncate xl:inline">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-[#D6A62E]" />
              </button>
              {authDropdownOpen && (
                <div id="auth-profile-dropdown" className="absolute right-0 top-12 w-56 border border-[#D6A62E]/30 bg-[#073B32] p-2 shadow-2xl">
                  <p className="border-b border-[#F5F1E8]/10 px-3 py-2 text-xs font-bold text-[#F5F1E8]">{currentUser.name}</p>
                  <button type="button" onClick={() => { setAuthDropdownOpen(false); if (canAccessAdmin(currentUser.role)) { setAdminTab('overview'); setView('admin_dashboard'); } else { setCustomerTab('dashboard'); setView('customer_dashboard'); } }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-[#F5F1E8]/85 hover:bg-[#0B4035]"><Car aria-hidden="true" className="h-3.5 w-3.5 text-[#D6A62E]" />Open dashboard</button>
                  <button id="navbar-signout-btn" type="button" onClick={() => { setAuthDropdownOpen(false); logout(); }} className="flex w-full items-center gap-2 border-t border-[#F5F1E8]/10 px-3 py-2.5 text-left text-xs font-bold text-rose-300 hover:bg-rose-500/10"><LogOut aria-hidden="true" className="h-3.5 w-3.5" />Sign out</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button type="button" onClick={startBooking} className="h-11 bg-[#D6A62E] px-4 text-[12px] font-black uppercase text-[#073B32]">Book</button>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation-drawer" aria-label="Toggle navigation menu" className="grid h-11 w-11 place-items-center border border-[#F5F1E8]/20 text-[#F5F1E8]">{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="border-b border-[#D6A62E]/30 bg-[#073B32] px-5 py-5 lg:hidden">
          <nav className="flex flex-col gap-3 text-sm font-semibold text-[#F5F1E8]">
            <button type="button" onClick={goHome} className="min-h-11 text-left text-[#D6A62E]">Home</button>
            {NAV_ITEMS.map(([label, id]) => <button key={id} type="button" onClick={() => scrollToSection(id)} className="min-h-11 text-left hover:text-[#D6A62E]">{label}</button>)}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#F5F1E8]/10 pt-4">
            <button type="button" onClick={() => { setMobileMenuOpen(false); openAuth('customer'); }} className="border border-[#F5F1E8]/20 py-2.5 text-xs font-bold text-[#F5F1E8]">Driver login</button>
            <a href={BUSINESS_CONFIG.phone.telLink} className="border border-[#D6A62E] py-2.5 text-center text-xs font-bold text-[#D6A62E]">Call {BUSINESS_CONFIG.phone.formatted}</a>
          </div>
        </div>
      )}
    </header>
  );
};

const ArrowUpRightIcon: React.FC = () => <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />;
